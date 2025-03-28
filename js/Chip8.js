class Chip8 {
  constructor() {
    this.v = new Uint8Array(16)
    this.i = 0
    this.pc = 0x200
    this.sp = 0
    this.memory = new Uint8Array(4096)
    this.stack = new Uint16Array(16)
    this.display = new Array(64 * 32).fill(0)
    this.keys = new Array(16).fill(0)
    this.delayTimer = 0
    this.soundTimer = 0
    this.paused = false
    this.scale = 10
    this.canvas = canvas({width: 64 * this.scale, height: 32 * this.scale})
    this.ctx = this.canvas.getContext('2d')
    document.body.appendChild(this.canvas)

    this.loadFonts()
    this.addInputEvent()
  }

  reset() {
    this.v.fill(0)
    this.i = 0
    this.pc = 0x200
    this.sp = 0
    for (let i = 0x200; i < this.memory.length; i++)
      this.memory[i] = 0
    this.stack.fill(0)
    this.display.fill(0)
    this.keys.fill(0)
    this.delayTimer = 0
    this.soundTimer = 0
    this.paused = false
  }


  loadFonts() {
    const fontSet = [
      0xF0, 0x90, 0x90, 0x90, 0xF0,
      0x20, 0x60, 0x20, 0x20, 0x70,
      0xF0, 0x10, 0xF0, 0x80, 0xF0,
      0xF0, 0x10, 0xF0, 0x10, 0xF0,
      0x90, 0x90, 0xF0, 0x10, 0x10,
      0xF0, 0x80, 0xF0, 0x10, 0xF0,
      0xF0, 0x80, 0xF0, 0x90, 0xF0,
      0xF0, 0x10, 0x20, 0x40, 0x40,
      0xF0, 0x90, 0xF0, 0x90, 0xF0,
      0xF0, 0x90, 0xF0, 0x10, 0xF0,
      0xF0, 0x90, 0xF0, 0x90, 0x90,
      0xE0, 0x90, 0xE0, 0x90, 0xE0,
      0xF0, 0x80, 0x80, 0x80, 0xF0,
      0xE0, 0x90, 0x90, 0x90, 0xE0,
      0xF0, 0x80, 0xF0, 0x80, 0xF0,
      0xF0, 0x80, 0xF0, 0x80, 0x80
    ]
    for (let i = 0; i < fontSet.length; i++)
      this.memory[i] = fontSet[i]
  }

  emulateCycle() {
    if (this.paused)
      return
    const opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1]
    this.pc += 2
    this.executeOpcode(opcode)
    if (this.delayTimer > 0)
      this.delayTimer--
    if (this.soundTimer > 0) {
      this.soundTimer--
      if (this.soundTimer === 0)
        this.playSound()
    }
  }

  playSound() {
    console.log('sound')
  }

  executeOpcode(opcode) {
    const x = (opcode & 0x0F00) >> 8
    const y = (opcode & 0x00F0) >> 4
    const n = opcode & 0x000F
    const nn = opcode & 0x00FF
    const nnn = opcode & 0x0FFF

    switch (opcode & 0xF000) {
      case 0x0000:
        if (nn === 0xE0) {
          this.display.fill(0)
        } else if (nn === 0xEE) {
          this.sp--
          this.pc = this.stack[this.sp]
        }
        break

      case 0x1000:
        this.pc = nnn
        break

      case 0x2000:
        this.stack[this.sp] = this.pc
        this.sp++
        this.pc = nnn
        break

      case 0x3000:
        if (this.v[x] === nn)
          this.pc += 2
        break

      case 0x4000:
        if (this.v[x] !== nn)
          this.pc += 2
        break

      case 0x5000:
        if (this.v[x] === this.v[y])
          this.pc += 2
        break

      case 0x6000:
        this.v[x] = nn
        break

      case 0x7000:
        this.v[x] = (this.v[x] + nn) & 0xFF
        break

      case 0x8000:
        switch (n) {
          case 0:
            this.v[x] = this.v[y]
            break

          case 1:
            this.v[x] |= this.v[y]
            break

          case 2:
            this.v[x] &= this.v[y]
            break

          case 3:
            this.v[x] ^= this.v[y]
            break

          case 4:
            const sum = this.v[x] + this.v[y]
            this.v[0xF] = +(sum > 0xFF)
            this.v[x] = sum & 0xFF
            break

          case 5:
            this.v[0xF] = this.v[x] >= this.v[y] ? 1 : 0
            this.v[x] = (this.v[x] - this.v[y]) & 0xFF
            break

          case 6:
            this.v[0xF] = this.v[x] & 0x1
            this.v[x] >>= 1
            break

          case 7:
            this.v[0xF] = this.v[y] >= this.v[x] ? 1 : 0
            this.v[x] = (this.v[y] - this.v[x]) & 0xFF
            break

          case 0xE:
            this.v[0xF] = +(this.v[x] & 0x80)
            this.v[x] <<= 1
            if (this.v[x] > 255)
              this.v[x] -= 256
            break
        }
        break

      case 0x9000:
        if (this.v[x] !== this.v[y])
          this.pc += 2
        break

      case 0xA000:
        this.i = nnn
        break

      case 0xB000:
        this.pc = nnn + this.v[x]
        break

      case 0xC000:
        this.v[x] = Math.floor(Math.random() * 256) & nn
        break

      case 0xD000:
        const x_coord = this.v[x] % 64
        const y_coord = this.v[y] % 32
        const height = n
        this.v[0xF] = 0
        for (let row = 0; row < height; row++) {
          const sprite_data = this.memory[this.i + row]
          for (let col = 0; col < 8; col++) {
            if ((sprite_data & (0x80 >> col)) !== 0) {
              const pos = (y_coord + row) * 64 + (x_coord + col)
              if (x_coord + col < 64 && y_coord + row < 32) {
                if (this.display[pos] === 1)
                  this.v[0xF] = 1
                this.display[pos] ^= 1
              }
            }
          }
        }
        break

      case 0xE000:
        if (nn === 0x9E)
          if (this.keys[this.v[x]] === 1)
            this.pc += 2
        else if (nn === 0xA1)
          if (this.keys[this.v[x]] === 0)
            this.pc += 2
        break

      case 0xF000:
        switch (nn) {
          case 0x0007:
            this.v[x] = this.delayTimer
            break
          case 0x0015:
            this.delayTimer = this.v[x]
            break
          case 0x0018:
            this.soundTimer = this.v[x]
            break
          case 0x001E:
            this.i += this.v[x]
            break
          case 0x000A:
            this.paused = true
            this.keyRegister = x
            break
          case 0x0029:
            this.i = this.v[x] * 5
            break
          case 0x0033:
            this.memory[this.i] = Math.floor(this.v[x] / 100)
            this.memory[this.i + 1] = Math.floor((this.v[x] % 100) / 10)
            this.memory[this.i + 2] = this.v[x] % 10
            break
          case 0x0055:
            for (let i = 0; i <= x; i++)
              this.memory[this.i + i] = this.v[i]
            break
          case 0x0065:
            for (let i = 0; i <= x; i++)
              this.v[i] = this.memory[this.i + i]
            break
        }
        break

      default:
        console.error("Unknown opcode:", opcode.toString(16))
    }
  }

  render() {
    this.ctx.shadowBlur = 0
    this.ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.5 + 0.5})`
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.fillStyle = '#0F0'
    this.ctx.shadowColor = '#0F0'
    this.ctx.shadowBlur = 10
    for (let i = 0; i < this.display.length; i++) {
      if (!this.display[i])
        continue
      const y = Math.floor(i / 64)
      const x = i % 64
      this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale)
    }
  }

  loadROM(romData) {
    for (let i = 0; i < romData.length; i++)
      this.memory[0x200 + i] = romData[i]
  }

  addInputEvent() {
    const keyMap = {
      '1': 0x1, '2': 0x2, '3': 0x3, '4': 0xC,
      'q': 0x4, 'w': 0x5, 'e': 0x6, 'r': 0xD,
      'a': 0x7, 's': 0x8, 'd': 0x9, 'f': 0xE,
      'z': 0xA, 'x': 0x0, 'c': 0xB, 'v': 0xF
    }

    document.addEventListener('keydown', e => {
      const key = e.key.toLowerCase()
      if (keyMap[key] !== undefined) {
        const chipKey = keyMap[key]
        this.keys[chipKey] = 1
        if (this.paused && this.keyRegister !== undefined) {
          this.v[this.keyRegister] = chipKey
          this.paused = false
          this.keyRegister = undefined
        }
      }
    })

    document.addEventListener('keyup', e => {
      const key = e.key.toLowerCase()
      if (keyMap[key] !== undefined)
        this.keys[keyMap[key]] = 0
    })
  }
}
