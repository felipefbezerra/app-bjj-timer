// No iPhone o treino segue em segundo plano pelo áudio (modo "audio" do iOS), então aqui não há nada a fazer.
// A versão Android fica em background.android.ts.

export type BgInfo = { title: string; desc: string; progress: number };

export const Background = {
  async start(_info: BgInfo) {},
  update(_info: BgInfo) {},
  async stop() {},
};
