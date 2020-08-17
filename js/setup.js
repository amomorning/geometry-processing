if (!Detector.webgl) Detector.addGetWebGLMessage();

let input = document.getElementById("fileInput");
let renderer = undefined;
let camera = undefined;
let controls = undefined;
let showWireframe = true;
let scene = undefined;
let wireframe = undefined;
let pickRenderer = undefined;
let pickScene = undefined;
let threeMesh = undefined;
let materialSettings = {
        vertexColors: THREE.VertexColors,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
        side: THREE.DoubleSide,
        flatShading: true,
        specular: new THREE.Color(0.0, 0.0, 0.0),
};

let guiFields = {
    "hello" : 5,
    "test" : 10,
    "Show Wireframe": showWireframe
}


init();
animate();

function init() {
    let container = document.createElement("div");
    document.body.appendChild(container);

    initRenderer(container);
    initGUI();
    initCamera();
    initScene();
    initLights();
    initMesh();
    initControls();
    addEventListeners();
}

function initRenderer(container) {
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xffffff, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    pickRenderer = new THREE.WebGLRenderer({
        antialias: false // turn antialiasing off for color based picking
    });
    pickRenderer.setPixelRatio(window.devicePixelRatio);
    pickRenderer.setClearColor(0xffffff, 1.0);
    pickRenderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(pickRenderer.domElement);
}

function initGUI() {
    let gui = new dat.GUI();
    gui.add(guiFields, "hello");
    gui.add(guiFields, "test");

    gui.add(guiFields, "Show Wireframe").onChange(toggleWireframe).listen();

}

function initCamera() {
    const fov = 45.0;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 1000;
    const eyeZ = 3.5;

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = eyeZ;

    uvCamera = new THREE.PerspectiveCamera(fov, 0.5 * aspect, near, far);
    uvCamera.position.z = eyeZ;
}

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    pickScene = new THREE.Scene();
    pickScene.background = new THREE.Color(0xffffff);

}

function initLights() {
    let ambient = new THREE.AmbientLight(0xffffff, 0.35);
    camera.add(ambient);

    let point = new THREE.PointLight(0xffffff);
    point.position.set(2, 20, 15);
    camera.add(point);

    scene.add(camera);
}

function initMesh() {
    let material = new THREE.MeshPhongMaterial(materialSettings);

    let cube1 = new THREE.BoxGeometry(3, 3, 3);
    let cubeBSP = new ThreeBSP(new THREE.Mesh(cube1));
    let cube2 = new THREE.BoxGeometry(2, 2, 2);
    let cube2M = new THREE.Mesh(cube2);
    cube2M.position.x += 2;
    let sphereBSP = new ThreeBSP(cube2M); 
    let geometry = cubeBSP.subtract ( sphereBSP ).toGeometry();
    threeMesh = new THREE.Mesh(geometry, material);

    scene.add(threeMesh);
    // create wireframe
    wireframe = new THREE.LineSegments();
    wireframe.geometry = new THREE.WireframeGeometry(geometry);
    wireframe.material = new THREE.LineBasicMaterial({
        color: 0x000000,
        linewidth: 0.75
    });

    let element = document.getElementById("meta");
    element.textContent = "now is showing";

    toggleWireframe(showWireframe);

}


function initControls() {
    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 5.0;
}

function addEventListeners() {
    window.addEventListener("click", onMouseClick, false);
    window.addEventListener("resize", onWindowResize, false);
}


function onMouseClick(event) {
    if (event.clientX >= 0 && event.clientX <= window.innerWidth &&
        event.clientY >= 0 && event.clientY <= window.innerHeight) {
        shiftClick = event.shiftKey;
        pick(event.clientX, event.clientY);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
    render();
}


function pick(clickX, clickY) {
    // draw
    let pickTexture = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    pickTexture.texture.generateMipmaps = false;
    pickRenderer.render(pickScene, camera, pickTexture);

    // read color
    let pixelBuffer = new Uint8Array(4);
    pickRenderer.readRenderTargetPixels(pickTexture, clickX, pickTexture.height - clickY, 1, 1, pixelBuffer);

    // convert color to id
    let pickId = pixelBuffer[0] + pixelBuffer[1] * 256 + pixelBuffer[2] * 256 * 256;
    if (pickId !== 0 && pickId !== 0x00ffffff) {
        solveScalarPoissonProblem(mesh.vertices[pickId - 1]);
    }
}

function toggleWireframe(checked) {
    showWireframe = checked;
    if (showWireframe) threeMesh.add(wireframe);
    else threeMesh.remove(wireframe);
}


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

function render() {
    renderer.render(scene, camera);
}
