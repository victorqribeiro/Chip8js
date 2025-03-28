async function getJson(src) {
  return await (await fetch(src)).json()
}

async function getBuffer(src) {
  return new Uint8Array(await (await fetch(src)).arrayBuffer())
}

async function init() {
  let u
  const demos = await getJson('demos.json')
  const games = await getJson('games.json')
  const sel = select({
      oninput: async function() {
        u && cancelAnimationFrame(u)
        chip8.reset()
        chip8.loadROM(await getBuffer(this.value))
        loop()
      }
    },
    ...[
      option('Pick a title'),
      demos.map(o => Object.entries(o).map(([title, src]) => option({value: './roms/demos/' + src}, title))).flat(),
      games.map(o => Object.entries(o).map(([title, src]) => option({value: './roms/games/' + src}, title))).flat()
    ].flat()
  )
  document.body.append(sel)
  const chip8 = new Chip8();
  function loop() {
    for (let i = 0; i < 10; i++)
      if (!chip8.paused)
        chip8.emulateCycle()
    chip8.render()
    u = requestAnimationFrame(loop)
  }
}

init()
