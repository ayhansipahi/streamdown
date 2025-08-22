import { useEffect, useRef, useState } from 'react';
import { cn } from './utils';

interface MermaidProps {
  chart: string;
  className?: string;
  debug?: boolean;
}

// Global mermaid instance
let mermaid: any = null;

const loadMermaid = async (): Promise<any> => {
  if (mermaid) return mermaid;
  
  // First check if mermaid is already available globally
  if (typeof window !== 'undefined' && (window as any).mermaid) {
    console.log('Mermaid: Found globally available');
    mermaid = (window as any).mermaid;
    return mermaid;
  }
  
  // Try to load from CDN
  if (typeof window !== 'undefined') {
    console.log('Mermaid: Loading from CDN...');
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
      script.type = 'text/javascript';
      
      script.onload = () => {
        if ((window as any).mermaid) {
          mermaid = (window as any).mermaid;
          console.log('Mermaid: CDN loaded successfully');
          resolve(mermaid);
        } else {
          reject(new Error('Mermaid not found after CDN load'));
        }
      };
      
      script.onerror = () => {
        console.error('Mermaid: CDN loading failed');
        reject(new Error('CDN loading failed'));
      };
      
      document.head.appendChild(script);
    });
  }
  
  throw new Error('Window not available');
};

export const Mermaid = ({ chart, className, debug = false }: MermaidProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mermaidInstance, setMermaidInstance] = useState<any>(null);

  // Initialize mermaid
  useEffect(() => {
    const initMermaid = async () => {
      try {
        if (debug) console.log('Mermaid: Starting initialization...');
        const instance = await loadMermaid();
        setMermaidInstance(instance);
        
        if (debug) console.log('Mermaid: Instance loaded:', instance);
        
        instance.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'strict',
          fontFamily: 'monospace',
          logLevel: debug ? 1 : 0,
        });
        
        if (debug) console.log('Mermaid: Initialization successful');
        setIsInitialized(true);
      } catch (err) {
        console.error('Mermaid: Initialization failed:', err);
        setError('Failed to initialize Mermaid');
      }
    };

    initMermaid();
  }, [debug]);

  // Render chart
  useEffect(() => {
    if (!isInitialized || !mermaidInstance || !containerRef.current || !chart?.trim()) {
      if (debug) {
        console.log('Mermaid: Render conditions not met:', {
          isInitialized,
          hasMermaidInstance: !!mermaidInstance,
          hasContainer: !!containerRef.current,
          hasChart: !!chart?.trim(),
          chartContent: chart?.substring(0, 50)
        });
      }
      return;
    }

    const renderChart = async () => {
      try {
        if (debug) console.log('Mermaid: Starting chart render...', { 
          chart: chart.substring(0, 100),
          chartLength: chart.length,
          containerElement: containerRef.current
        });
        setIsLoading(true);
        setError(null);
        
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (debug) console.log('Mermaid: Generated ID:', id);
        
        if (debug) console.log('Mermaid: Calling render with instance:', mermaidInstance);
        if (debug) console.log('Mermaid: Render method available:', typeof mermaidInstance.render);
        
        const result = await mermaidInstance.render(id, chart);
        if (debug) console.log('Mermaid: Render result:', result);
        if (debug) console.log('Mermaid: SVG result:', result?.svg?.substring(0, 200));
        
        if (containerRef.current && result?.svg) {
          if (debug) console.log('Mermaid: Setting innerHTML with SVG, container:', containerRef.current);
          containerRef.current.innerHTML = result.svg;
          if (debug) console.log('Mermaid: SVG set successfully, container innerHTML length:', containerRef.current.innerHTML.length);
        } else {
          throw new Error(`No SVG result from Mermaid render. Result: ${JSON.stringify(result)}`);
        }
      } catch (err) {
        console.error('Mermaid: Render error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render Mermaid chart');
      } finally {
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart, isInitialized, mermaidInstance, debug]);

  if (!isInitialized) {
    return (
      <div className={cn('p-4 border border-gray-200 bg-gray-50 rounded-lg', className)}>
        <p className="text-gray-700 text-sm">Loading Mermaid...</p>
        {debug && <p className="text-xs text-gray-500 mt-1">Debug: Initializing...</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 border border-red-200 bg-red-50 rounded-lg', className)}>
        <p className="text-red-700 text-sm font-mono">Mermaid Error: {error}</p>
        <details className="mt-2">
          <summary className="text-red-600 text-xs cursor-pointer">Show Code</summary>
          <pre className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded overflow-x-auto">
            {chart}
          </pre>
        </details>
        {debug && (
          <details className="mt-2">
            <summary className="text-red-600 text-xs cursor-pointer">Debug Info</summary>
            <pre className="text-xs text-red-800 bg-red-100 p-2 rounded">
              {JSON.stringify({
                isInitialized,
                hasMermaidInstance: !!mermaidInstance,
                hasContainer: !!containerRef.current,
                chartLength: chart?.length
              }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('p-4 border border-blue-200 bg-blue-50 rounded-lg', className)}>
        <p className="text-blue-700 text-sm">Rendering chart...</p>
        {debug && <p className="text-xs text-blue-500 mt-1">Debug: Rendering...</p>}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={cn('flex justify-center my-4', className)}
      role="img"
      aria-label="Mermaid chart"
    />
  );
};
