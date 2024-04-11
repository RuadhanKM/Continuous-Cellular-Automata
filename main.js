const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const mainGrid = new Float32Array(canvas.width * canvas.height);
const imageData = new ImageData(canvas.width, canvas.height);

function hsv2rgb(h,s,v) {                              
    let f= (n,k=(n+h/60)%6) => v - v*s*Math.max( Math.min(k,4-k,1), 0);     
    return [f(5),f(3),f(1)];       
}

function getFlattenedWrappedPixelOffset(x, y) {
    return (((y % canvas.height) + canvas.height) % canvas.height) * canvas.width + (((x % canvas.width) + canvas.width) % canvas.width);
}

function getGrid(x, y) {
    return mainGrid[getFlattenedWrappedPixelOffset(x, y)];
}

function setGrid(x, y, v) {
    v = Math.max(Math.min(v, 1), 0);
    let o = getFlattenedWrappedPixelOffset(x, y);
    let [r, g, b] = hsv2rgb(v*180+tick/3+x+y, 1-v*0.8, v*0.7+0.2);

    mainGrid[o] = v;
    imageData.data[o * 4 + 0] = r*255;
    imageData.data[o * 4 + 1] = g*255;
    imageData.data[o * 4 + 2] = b*255;
    imageData.data[o * 4 + 3] = 255;
}

let kernelSize = 5;
let updateFrequency = 5;
let kernelShape = 1;
let tick = 0;
let showKernel = false;
let mousePos = [0, 0];

function calculateKernelWeight(ox, oy) {
    let dis = Math.sqrt(ox**2+oy**2);
    return Math.exp(-((dis-kernelSize/2)**2)/(kernelSize*kernelShape));
}

function getPixelKernel(x, y) {
    let total = 0;
    let totalWeight = 0;

    for (let oy=-kernelSize; oy<=kernelSize; oy++) {
        for (let ox=-kernelSize; ox<=kernelSize; ox++) {
            if (ox == 0 && oy == 0) continue;

            let weight = calculateKernelWeight(ox, oy);
            let val = getGrid(x-ox, y-oy) * weight;

            totalWeight += weight;
            total += val;
        }
    }

    return total / totalWeight;
}

function growth(avg) {
    return 2 * Math.exp(-(64*(avg-0.5)**2)/2) - 1;
}

for (let y=0; y<canvas.height; y++) {
    for (let x=0; x<canvas.width; x++) {
        setGrid(x, y, Math.random());
    }
}

function renderLoop() {
    for (let y=0; y<canvas.height; y++) {
        for (let x=0; x<canvas.width; x++) {
            setGrid(x, y, getGrid(x, y) + growth(getPixelKernel(x, y))/updateFrequency);
        }
    }

    // Paint
    if (mousePos[0] > 0 && mousePos[0] < canvas.width && mousePos[1] > 0 && mousePos[1] < canvas.height) {
        let brushSize = Math.max(Math.floor(kernelSize/2), 1);
        for (let oy=-brushSize; oy<=brushSize; oy++) {
            for (let ox=-brushSize; ox<=brushSize; ox++) {
                let weight = 1-Math.sqrt(ox**2+oy**2)/(brushSize*Math.SQRT2);
                setGrid(mousePos[0]-ox, mousePos[1]-oy, getGrid(mousePos[0]-ox, mousePos[1]-oy) + weight);
            }
        }
    }
    
    if (showKernel) {
        // Display kernel
        for (let y=0; y<kernelSize*2+1; y++) {
            for (let x=0; x<kernelSize*2+1; x++) {
                let o = getFlattenedWrappedPixelOffset(x, y);
                let val = calculateKernelWeight(x - kernelSize, y - kernelSize);
                imageData.data[o * 4 + 0] = 20;
                imageData.data[o * 4 + 1] = val*255;
                imageData.data[o * 4 + 2] = (1-val)*255;
                imageData.data[o * 4 + 3] = 255;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);

    tick++;
}

setInterval(renderLoop, 0);

{
    let kernelButton = document.getElementById("toggleKernel");
    let randomizeButton = document.getElementById("randomize");
    let clearButton = document.getElementById("clear");
    let kernelRange = document.getElementById("kernelSizeRange");
    let kernelShapeRange = document.getElementById("kernelShapeRange");
    let speedRange = document.getElementById("speedRange");

    clearButton.addEventListener("click", () => {
        for (let y=0; y<canvas.height; y++) {
            for (let x=0; x<canvas.width; x++) {
                setGrid(x, y, 0);
            }
        }
        ctx.putImageData(imageData, 0, 0);
    })

    randomizeButton.addEventListener("click", () => {
        for (let y=0; y<canvas.height; y++) {
            for (let x=0; x<canvas.width; x++) {
                setGrid(x, y, Math.random());
            }
        }
        ctx.putImageData(imageData, 0, 0);
    });

    kernelButton.addEventListener("click", () => {
        showKernel = !showKernel;
        kernelButton.innerText = showKernel ? "Hide Kernel" : "Show Kernel";
    });

    kernelRange.addEventListener("input", e => {
        kernelSize = parseInt(e.target.value);
    })

    speedRange.addEventListener("input", e => {
        updateFrequency = parseInt(e.target.value);
    })

    kernelShapeRange.addEventListener("input", e => {
        kernelShape = Math.exp(parseInt(e.target.value)/25);
    })

    document.addEventListener("mousemove", e => {
        mousePos[0] = Math.floor((e.clientX-canvas.offsetLeft/2)/canvas.offsetWidth*canvas.width);
        mousePos[1] = Math.floor((e.clientY-canvas.offsetTop/2)/canvas.offsetHeight*canvas.height);
    })
}