import { useEffect, useRef, useState, RefObject } from 'react';

type Size = {
  width: number;
  height: number;
};

/**
 * useResizeObserver
 * 监听返回一个 ref 和当前元素尺寸 { width, height }
 * 使用 ResizeObserver，如果不可用则回退到 window.resize
 * 用法：const [ref, size] = useResizeObserver<HTMLDivElement>();
 */
export default function useResizeObserver<T extends HTMLElement>(): [RefObject<T>, Size] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 初始读取当前size
    const read = () => {
      const node = ref.current;
      if (!node) return;
      setSize({ width: node.clientWidth, height: node.clientHeight });
    };
    read();

    if (typeof (window as any).ResizeObserver === 'undefined') {
      const onResize = () => read();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    const ro = new (window as any).ResizeObserver(() => {
      read();
    });
    ro.observe(el);

    return () => {
      try {
        ro.disconnect();
      } catch (e) {
        // ignore
      }
    };
    // 刻意留空依赖项：需要对 ref 绑定的元素进行持续监听
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, size];
}
