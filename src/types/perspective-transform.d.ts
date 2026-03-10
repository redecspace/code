declare module 'perspective-transform' {
  interface PerspT {
    transform: (x: number, y: number) => [number, number];
    coeffs: number[];
    coeffsInv: number[];
  }

  function PerspT(src: number[], dst: number[]): PerspT;
  export default PerspT;
}
