<script>
	/*
	- auto scaling / zooming based on the bounding box
	- shading based on the normal
	- point light source
	- rotation along a single axis
	- backface culling
	*/

	import { onMount } from 'svelte';
	import { parseSolid } from './parser';
	
	export let name;
	let selected;
	const scale = 200;
	const zFactor = 5;
	const drawAxis = false;

	let canvas;
	let ctx;
	
	const bbox = {
		minX : Infinity,
		maxX : -Infinity,
		minY : Infinity,
		maxY : -Infinity,
		minZ : Infinity,
		maxZ : -Infinity
	}
	
	const size = {
		x: 0,
		y: 0,
		z: 0
	}

	const center = {
		x: 0,
		y: 0,
		z: 0
	}

	let offset = {
		x: 0,
		y: 0,
		z: 0
	}


	// const canvas = document.getElementsByTagName('canvas');
	
	onMount(() => {
		selected = 'teapot.stl';
	});

	
	$: {
		if (selected)
			render(selected);
	}
	
	async function render(filename) {
		ctx = canvas.getContext('2d');
		// ctx.scale(scale,scale);
		ctx.lineWidth = 2/scale;
		const width = canvas.width;
		const height = canvas.height;

		const response = await fetch('files/' + filename);
		const data = await response.text();

		if (data[0] == '<') {
			console.error('file probably not found');
			return;
		}
		const { facets, stlName } = parseSolid(data)///.slice(0,3);
		name = stlName;
		
		console.time('analyzing');
		analyze(facets);
		console.timeEnd('analyzing');
		
		ctx.translate(width/2, height/2);
		ctx.scale(scale, scale);

		if (drawAxis) {
			ctx.beginPath();
			ctx.moveTo(0,-height/scale);
			ctx.lineTo(0,height/scale);

			ctx.moveTo(-width/scale, 0);
			ctx.lineTo(width/scale, 0);
			ctx.stroke();
		}
		drawBBox();
				
		drawSolid(facets, 'rgba(0,0,0,0.5)', 'rgba(255,0,0,0.5)');
	}

	function analyze(facets) {
		console.log('facets', facets.length);
		for (let f=0 ; f<facets.length ; f++) {
			const facet = facets[f];
			updateBBox(facet.v1);
			updateBBox(facet.v2);
			updateBBox(facet.v3);

			updateNormal(facet);
		}

		size.x = bbox.maxX - bbox.minX;
		size.y = bbox.maxY - bbox.minY;
		size.z = bbox.maxZ - bbox.minZ;

		center.x = bbox.minX + size.x/2;
		center.y = bbox.minY + size.y/2;
		center.z = bbox.minZ + size.z/2;

		console.log('bbox',bbox);
		console.log('size', size);
	}

	function drawSolid(facets, strokeStyle, fillStyle) {
		console.time('rendering');
		
		if (fillStyle)
			ctx.fillStyle = fillStyle;
		
		if (strokeStyle)
			ctx.strokeStyle = strokeStyle;

		ctx.beginPath();
		for (let f=0 ; f<facets.length ; f++) {
			const facet = facets[f];
			if (facet.normal.z > 0)
				drawFacet(facet, 'black', f % 2 == 0 ? 'grey' : 'grey');
				//drawFacet(facet, 'black', '#' + Math.floor(Math.random()*16777215).toString(16));
			// console.log(facets[f]);
			// break;
		}

		console.timeEnd('rendering');
	}

	function updateNormal(facet) {
		// if (facet.normal.x !== 0 || facet.normal.y !== 0 || facet.normal.z !== 0)
		// 	return;
		
		//	https://stackoverflow.com/questions/19350792/calculate-normal-of-a-single-triangle-in-3d-space
		// A = v2 - v1 
		const A = { 
			x : facet.v2.x - facet.v1.x,
			y : facet.v2.y - facet.v1.y,
			z : facet.v2.z - facet.v1.z
		};

		// B = v3 - v1
		const B = {
			x : facet.v3.x - facet.v1.x,
			y : facet.v3.y - facet.v1.y,
			z : facet.v3.z - facet.v1.z
		};

		// Nx = Ay * Bz - Az * By
		// Ny = Az * Bx - Ax * Bz
		// Nz = Ax * By - Ay * Bx
		facet.normal =  {
			x: (A.x * B.x - A.z * B.y) * scale * 100,
			y: (A.z * B.x - A.x * B.z) * scale * 100,
			z: (A.x * B.y - A.y * B.x) * scale * 100
		};
		// console.log(facet.normal);
	}

	function updateBBox(vertex) {
		bbox.maxX = Math.max(bbox.maxX, vertex.x);
		bbox.minX = Math.min(bbox.minX, vertex.x);

		bbox.maxY = Math.max(bbox.maxY, vertex.y);
		bbox.minY = Math.min(bbox.minY, vertex.y);

		bbox.maxZ = Math.max(bbox.maxZ, vertex.z);
		bbox.minZ = Math.min(bbox.minZ, vertex.z);
	}

	function drawBBox() {
		const points = [
			{ x: bbox.minX, y:bbox.minY },
			{ x: bbox.maxX, y:bbox.minY },
			{ x: bbox.maxX, y:bbox.maxY },
			{ x: bbox.minX, y:bbox.maxY },
		];
		console.log(points);
		draw3dShape(points, 'blue', 'red')
	}

	function draw3dLine(points, strokeStyle) {
		const p0 = project2d(points[0]);

		ctx.beginPath();
		ctx.moveTo(p0.x, p0.y)
		for (let p=1 ; p<points.length ; p++) {
			const point = project2d(points[p]);
			ctx.lineTo(point.x, point.y);
		}
		ctx.closePath();

		if (strokeStyle)
			ctx.strokeStyle = strokeStyle;
		ctx.stroke();
	}

	function draw3dShape(points, strokeStyle, fillStyle) {
		draw3dLine([...points,points[0]] , strokeStyle);
		
		if (fillStyle)
			ctx.fillStyle = fillStyle;

		ctx.fill();
	}

	function drawFacet(facet, strokeStyle, fillStyle) {
		//console.log(facet);
		
		draw3dShape([facet.v1,facet.v2,facet.v3], strokeStyle, fillStyle);
	}

	function drawNormal(facet) {
		// const centroid = {
		// 	x: (facet.v1.x + facet.v2.x + facet.v3.x)/3,
		// 	y: (facet.v1.y + facet.v2.y + facet.v3.y)/3,
		// 	z: (facet.v1.z + facet.v2.z + facet.v3.z)/3,
		// };

		// const pc = project2d(centroid);
		// const normal = project2d({
		// 	x: pc.x + facet.normal.x,
		// 	y: pc.y + facet.normal.y,
		// 	z: pc.z + facet.normal.z,
		// });
		// ctx.beginPath();
		// ctx.moveTo(pc.x, pc.y);
		// ctx.lineTo(normal.x, normal.y);
		// ctx.stroke();
		
	}


	function rotateYZ(point) {
		// const angle = Math.atan2(point.y, point.z);
		// Math.cos(point.y)
		return point;
	}

	function project2d(point) {
		offset = {
			x: center.x,
			y: center.y,
			z: size.z + 3
		};
		const z = point.z - offset.z;
		return {
			x: (point.x - offset.x)*z,
			y: (point.y - offset.y)*z,
		}
	}

	function projectIso(point) {
		return {
			x: point.x,
			y: point.y - point.z
		}
	}
</script>

<main>
	<h2>
		<select  bind:value={selected} >
		<option>teapot.stl</option>
		<option>block100.stl</option>
		<option>bottle.stl</option>
		<option>humanoid.stl</option>
		<option>humanoid_tri.stl</option>
		<option>magnolia.stl</option>
		<option>space_invader_magnet.stl</option>
		<option>sphere.stl</option>
	</select>{name}</h2>
	<canvas
		bind:this={canvas}
		width=1024
		height=512
		></canvas>
</main>

<style>
	main {
		text-align: center;
		margin: 0 auto;
		background-color: rgb(174, 173, 173);
		width: 100%;
		height:100%;
	}

	canvas {
		background-color: white;
	}
</style>
