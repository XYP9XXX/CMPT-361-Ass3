import { Framebuffer } from './framebuffer.js';
import { Rasterizer } from './rasterizer.js';
// DO NOT CHANGE ANYTHING ABOVE HERE

////////////////////////////////////////////////////////////////////////////////
// TODO: Implement functions drawLine(v1, v2) and drawTriangle(v1, v2, v3) below.
////////////////////////////////////////////////////////////////////////////////

// take two vertices defining line and rasterize to framebuffer
Rasterizer.prototype.drawLine = function(v1, v2) {
  // Get two vertices first
  const [x1, y1, [r1, g1, b1]] = v1;
  const [x2, y2, [r2, g2, b2]] = v2;

  // Get color of each vertices
  let startColor = [r1, g1, b1];
  let endColor = [r2, g2, b2];

  // Compute the x/y change.
  let dx = x2 - x1;
  let dy = y2 - y1;

  // Let the number of stpes equal to x/y which has larger change in coordinates.
  let steps = Math.abs(dx) > Math.abs(dy) ? Math.abs(dx) : Math.abs(dy);
  let xIncrement = dx / steps;
  let yIncrement = dy / steps;

  // Set the start point of x/y 
  let x = x1;
  let y = y1;

  if ((v1[0] == v2[0]) && (v1[1] == v2[1])) {
    // Test if start point is equal to end point. If so, the line is just a point, and set this point with start point color.
    this.setPixel(Math.round(x), Math.round(y), [r1, g1, b1]);
  } else { // In the other case, it is a line, we need to use color interpolation method to determin each pixel's color.
      for (let i = 0; i <= steps; i++) {
        // First step is detern min the t value of the current point,which is used futher for determin color. (formula: Cp = (1 - t) * C1 + t * C2)
        let t = (Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2))) / (Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)));

        // Use color:Interpolation function to determin the color
        let [r, g, b] = colorInterpolation(startColor, endColor, t); 

        // Set pixel
        this.setPixel(Math.round(x), Math.round(y), [r, g, b]);

        // Increment coordinates with step size.
        x += xIncrement;
        y += yIncrement;
      }
  }
}

// take 3 vertices defining a solid triangle and rasterize to framebuffer
Rasterizer.prototype.drawTriangle = function(v1, v2, v3) {
  // Get three points at first
  const [x1, y1, [r1, g1, b1]] = v1;
  const [x2, y2, [r2, g2, b2]] = v2;
  const [x3, y3, [r3, g3, b3]] = v3;

  // If three points are equal, just return.
  if((v1[0] == v2[0]) && (v2[0] == v3[0]) && (v1[1] == v2[1]) && (v2[1] == v3[1])) {
    return;
  }

  // Create a bounding box for the triangle, then we just test only for points in bounding box.
  let minX = Math.min(x1, x2, x3);
  let maxX = Math.max(x1, x2, x3);
  let minY = Math.min(y1, y2, y3);
  let maxY = Math.max(y1, y2, y3);

  // Test points and set points.
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      let point = [x, y];
      if (pointIsInsideTriangle(v1, v2, v3, point)) {
        let color = barycentricCoordinates(v1, v2, v3, point); 
        this.setPixel(Math.floor(x), Math.floor(y), color);
      }
    }
  }
}

// Function to determin the color of a pixel along a line.
function colorInterpolation (startColor, endColor, t) {
  return[
    startColor[0] * (1 - t) + endColor[0] * t, // red
    startColor[1] * (1 - t) + endColor[1] * t, // green
    startColor[2] * (1 - t) + endColor[2] * t  // blue
  ];
}

// Function to determin if a point is inside a triangle.
function pointIsInsideTriangle (v0, v1, v2, p) {
  let bool1 = edgeEquationTest(v0, v1, p)
  let bool2 = edgeEquationTest(v1, v2, p)
  let bool3 = edgeEquationTest(v2, v0, p)
  return (bool1 == bool2) && (bool2 == bool3)
}

// Helper function to determin if a point is inside of one half-planes.
function edgeEquationTest (v0, v1, p) {
  // Calculate the abc for a given line, which equation is ax + by + c = 0
  let a = v1[1] - v0[1];
  let b = v0[0] - v1[0];
  let c = v1[0] * v0[1] - v0[0] * v1[1];

  // Put current point into equation
  let value = a * p[0] + b * p[1] + c;

  // If value is equal to 0, its an edge case, we need to use top-lef rule to determin if we should choose this pixel.
  if (value == 0) {
    return ((a > 0) || (a == 0 && b > 0));  // a < 0 means left edge, because in this canvas, the point with lower position has a bigger y value, a == 0 and b > 0 means top edge, b > 0 because we can know that its from right to left.
  }
  return value > 0;
}

// Helper function to calculate the area of the triangle
function triangleArea (v0, v1, v2) {
  let vector0 = [v1[0] - v0[0], v1[1] - v0[1]];
  let vector1 = [v2[0] - v0[0], v2[1] - v0[1]];
  return Math.abs(vector0[0] * vector1[1] - vector0[1] * vector1[0]) / 2;
}

function barycentricCoordinates (v0, v1, v2, p) {
  // Get three points' colors first
  let c0 = v0[2];
  let c1 = v1[2];
  let c2 = v2[2];

  // Area of big triangle
  let A = triangleArea(v0, v1, v2);

  // Area of three small triangle
  let a0 = triangleArea(p, v1, v2);
  let a1 = triangleArea(v0, p, v2);
  let a2 = triangleArea(v0, v1, p);

  // Calculate barycentric coordinates
  let u = a0 / A;
  let v = a1 / A;
  let w = a2 / A;

  // Get color at p
  let color = [
    u * c0[0] + v * c1[0] + w * c2[0], // Red
    u * c0[1] + v * c1[1] + w * c2[1], // Green
    u * c0[2] + v * c1[2] + w * c2[2], // Blue
  ]
  return color;
}



////////////////////////////////////////////////////////////////////////////////
// EXTRA CREDIT: change DEF_INPUT to create something interesting!
////////////////////////////////////////////////////////////////////////////////
const DEF_INPUT = [
  // "v,10,10,1.0,0.0,0.0;",
  // "v,52,52,0.0,1.0,0.0;",
  // "v,52,10,0.0,0.0,1.0;",
  // "v,10,52,1.0,1.0,1.0;",
  // "t,0,1,2;",
  // "t,0,3,1;",
  // "v,10,10,1.0,1.0,1.0;",
  // "v,10,52,0.0,0.0,0.0;",
  // "v,52,52,1.0,1.0,1.0;",
  // "v,52,10,0.0,0.0,0.0;",
  // "l,4,5;",
  // "l,5,6;",
  // "l,6,7;",
  // "l,7,4;"
  "v,0,0,1.0,0.5,0.0;", // sun
  "v,15,0,1.0,0.8,0.0;", // sun 
  "v,0,15,1.0,1.0,0.0;", // sun 
  "t,0,1,2;", // draw sun
  
  "v,5,45,0.0,0.5,0.3;", // mountain 1 
  "v,15,35,0.0,0.6,0.2;", // mountain 1 
  "v,25,45,0.0,0.5,0.3;", // mountain 1 
  "t,3,4,5;", // draw mountain 1

  "v,25,40,0.5,0.65,0.3;", // mountain 2
  "v,35,15,0.2,0.75,0.4;", // mountain 2 
  "v,45,40,0.5,0.55,0.3;", // mountain 2 
  "t,6,7,8;", // draw mountain 2

  "v,15,45,0.4,0.45,0.3;", // mountain 3
  "v,25,25,0.2,0.55,0.4;", // mountain 3 
  "v,35,45,0.0,0.45,0.2;", // mountain 3 
  "t,9,10,11;", // draw mountain 3  

  "v,40,45,0.5,0.55,0.3;", // mountain 4 
  "v,52,20,0.2,0.65,0.4;", // mountain 4 
  "v,64,45,0.5,0.45,0.3;", // mountain 4 
  "t,12,13,14;", // draw mountain 4

  "v,10,55,0.0,0.6,1.0;", // river 1 
  "v,20,55,0.0,0.8,1.0;", // river 1 
  "v,30,59,0.2,0.6,1.0;", // river 2 
  "v,50,59,0.3,0.8,1.0;", // river 2
  "v,50,47,0.2,0.4,1.0;", // river 3
  "v,63,47,0.3,0.5,0.8;", // river 3
  "v,5,50,0.0,0.7,1.0;", // river 4
  "v,17,50,0.0,0.5,0.8;", // river 4
  "v,25,52,0.0,1.0,1.0;", // river 5
  "v,45,52,0.0,0.6,0.8;", // river 5
  "v,40,46,0.0,0.7,0.9;", // river 5
  "v,45,46,0.0,0.4,0.6;", // river 5
  "l,15,16;", // draw river 1 
  "l,17,18;", // draw river 2
  "l,19,20;", // draw river 3
  "l,21,22;", // draw river 4
  "l,23,24;", // draw river 5
  "l,25,26;", // draw river 6
].join("\n");


// DO NOT CHANGE ANYTHING BELOW HERE
export { Rasterizer, Framebuffer, DEF_INPUT };
