async function getJson(src) {
  return await (await fetch(src)).json()
}

async function getBuffer(src) {
  return new Uint8Array(await (await fetch(src)).arrayBuffer())
}

async function init() {
  let u
  const state = createState({glow: true, flicker: true, color: 'hsl(100, 100.00%, 50.00%)', cycles: 10})
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
  const glowInput = label(input({type: 'checkbox', checked: state.glow, oninput: function() {
    state.glow = !state.glow
  }}), 'Glow')
  const flickerInput = label(input({type: 'checkbox', checked: state.flicker, oninput: function() {
    state.flicker = !state.flicker
  }}), 'Flicker')
  const cycleControl = label(select({value: state.cycles, style: {margin: '0 0.5em'}, oninput: function() {
      u && cancelAnimationFrame(u)
      state.cycles = this.value
      loop()
    }}, ...[1, 5, 10, 15, 20].map(c => option({value: c, selected: state.cycles == c}, c))), 'Cycles per frame')
  document.body.append(sel, div(glowInput, flickerInput, cycleControl, ColorPicker(state)))
  const chip8 = new Chip8(state)
  function loop() {
    for (let i = 0; i < state.cycles; i++)
      if (!chip8.paused)
        chip8.emulateCycle()
    chip8.render()
    u = requestAnimationFrame(loop)
  }
}

init()
