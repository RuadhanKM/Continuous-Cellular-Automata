const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const mainGrid = new Float32Array(canvas.width * canvas.height);
const imageData = new ImageData(canvas.width, canvas.height);

function getFlattenedWrappedPixelOffset(x, y) {
    return (((y % canvas.height) + canvas.height) % canvas.height) * canvas.width + (((x % canvas.width) + canvas.width) % canvas.width);
}

function getGrid(x, y) {
    return mainGrid[getFlattenedWrappedPixelOffset(x, y)];
}

function setGrid(x, y, v) {
    v = Math.max(Math.min(v, 1), 0);
    let o = getFlattenedWrappedPixelOffset(x, y);
    mainGrid[o] = v;
    imageData.data[o * 4 + 0] = Math.floor(v*255);
    imageData.data[o * 4 + 1] = Math.floor(v*255);
    imageData.data[o * 4 + 2] = Math.floor(v*255);
    imageData.data[o * 4 + 3] = 255;
}

const kernelSize = 5;
const updateFrequency = 5;
let showKernel = false;

function calculateKernelWeight(ox, oy) {
    let dis = Math.sqrt(ox**2+oy**2);
    return Math.exp(-((dis-kernelSize/2)**2)/kernelSize);
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
}

setInterval(renderLoop, 0);

{
    let kernelButton = document.getElementById("toggleKernel");
    let randomizeButton = document.getElementById("randomize");
    let clearButton = document.getElementById("clear");

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

    canvas.addEventListener("mousemove", e => {
        let bx = Math.floor(e.offsetX/canvas.offsetWidth*canvas.width);
        let by = Math.floor(e.offsetY/canvas.offsetHeight*canvas.height);

        for (let oy=-kernelSize; oy<=kernelSize; oy++) {
            for (let ox=-kernelSize; ox<=kernelSize; ox++) {
                if (ox == 0 && oy == 0) continue;
    
                let weight = calculateKernelWeight(ox, oy);
                setGrid(bx-ox, by-oy, getGrid(bx-ox, by-oy) + weight);
            }
        }
    })
}