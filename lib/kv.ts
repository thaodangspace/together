export async function getKv() {
  return await Deno.openKv();
}
