const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const mainGrid = new Float32Array(canvas.width * canvas.height);
const imageData = new ImageData(canvas.width, canvas.height);

function getGrid(x, y) {
    return mainGrid[(((y % canvas.height) + canvas.height) % canvas.height) * canvas.width + (((x % canvas.width) + canvas.width) % canvas.width)];
}

function setGrid(x, y, v) {
    let o = (((y % canvas.height) + canvas.height) % canvas.height) * canvas.width + (((x % canvas.width) + canvas.width) % canvas.width);
    mainGrid[o] = v;
    imageData.data[o * 4 + 0] = v*255;
    imageData.data[o * 4 + 1] = v*255;
    imageData.data[o * 4 + 2] = v*255;
    imageData.data[o * 4 + 3] = 255;
}

const kernelSize = 1;

function calculateKernelWeight(ox, oy) {
    return 1;
}

function getPixelKernel(x, y) {
    let total = 0;

    for (let oy=-kernelSize; oy<=kernelSize; oy++) {
        for (let ox=-kernelSize; ox<=kernelSize; ox++) {
            if (ox == 0 && oy == 0) continue;

            let weight = calculateKernelWeight(ox, oy);
            let val = getGrid(x-ox, y-oy) * weight;

            total += val;
        }
    }

    return total;
}

function growth(avg) {
    return 2 * Math.exp(-(avg**2)/2) - 1;
}

for (let y=0; y<canvas.height; y++) {
    for (let x=0; x<canvas.width; x++) {
        setGrid(x, y, Math.random());
    }
}

ctx.putImageData(imageData, 0, 0);

function renderLoop() {
    for (let y=0; y<canvas.height; y++) {
        for (let x=0; x<canvas.width; x++) {
            setGrid(x, y, getGrid(x, y) + growth(getPixelKernel(x, y)));
        }
    }



    ctx.putImageData(imageData, 0, 0);
}



setInterval(renderLoop, 500);