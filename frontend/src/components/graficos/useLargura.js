// Largura real de um elemento (para o SVG desenhar nítido em qualquer tela).
import { useEffect, useRef, useState } from 'react';

export default function useLargura(inicial = 320) {
  const ref = useRef(null);
  const [largura, setLargura] = useState(inicial);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return undefined;
    const medir = () => setLargura(Math.max(Math.round(elemento.getBoundingClientRect().width), 120));
    medir();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return [ref, largura];
}
