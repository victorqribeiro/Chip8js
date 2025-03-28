function ColorPicker(state) {
    const square = div({
        style: {
            width: '50px', height: '50px',
            border: 'solid 1px black',
            backgroundColor: state.color,
            margin: '0 auto',
        }
    })
    const dt = datalist({ id: 'dtl' }, option({ value: '50' }))
    const hue = input({
        width: '130px',
        type: 'range',
        min: 0,
        max: 360,
        step: 1,
        value: 100,
        style: {
            '-webkit-appearance': 'none',
            background: 'linear-gradient(90deg in hsl longer hue, hsl(0, 100%, 50%), hsl(0, 100%, 50%))',
            border: 'solid 1px black'
        },
        oninput,
    })
    const sat = input({
        type: 'range',
        orient: 'vertical',
        min: 0,
        max: 100,
        step: 1,
        value: 100,
        style: {
            writingMode: 'vertical-lr',
            direction: 'rtl',
            height: '70px',
            width: '30px',
        },
        oninput,
    })
    const bri = input({
        type: 'range',
        orient: 'vertical',
        min: 0,
        max: 100,
        step: 1,
        value: 50,
        list: 'dtl',
        style: {
            writingMode: 'vertical-lr',
            direction: 'rtl',
            height: '70px',
            width: '30px',
        },
        oninput,
    })
    const style = {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        border: 'solid 1px black',
        padding: '1em',
        backgroundColor: 'lightgray',
    }
    function oninput() {
        state.color = square.style.backgroundColor = `hsl(${hue.value}, ${sat.value}%, ${bri.value}%)`
        hue.style.background = `linear-gradient(90deg in hsl longer hue, 
            hsl(0, ${sat.value}%, ${bri.value}%), hsl(0, ${sat.value}%, ${bri.value}%))`
    }
    return div(
        { style },
        div(square, hue),
        div(sat, bri),
        dt
    )
}