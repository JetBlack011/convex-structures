import P5 from "p5";
import { hilbertBisectorSketch } from "./sketches/hilbertBisector";
import { hyperbolicVoronoiSketch } from "./sketches/hyperbolicVoronoi";
import { hyperbolicGeodesicsSketch } from "./sketches/hyperbolicGeodesics";

let sketch: P5;

function updateSketch() {
    let sketchSelect = document.getElementById('sketchSelect');

    if (sketchSelect.value == 'hilbert')
        sketch = new P5(hilbertBisectorSketch);
    else if (sketchSelect.value == 'voronoi')
        sketch = new P5(hyperbolicVoronoiSketch);
    else if (sketchSelect.value == 'geodesics')
        sketch = new P5(hyperbolicGeodesicsSketch);
}

document.getElementById('sketchSelect').onchange = () => {
    sketch.remove();
    updateSketch();
};

updateSketch();

export { updateSketch };
