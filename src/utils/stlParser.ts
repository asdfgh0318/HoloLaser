/**
 * STL file parser supporting both binary and ASCII formats.
 * Parses geometry into flat typed arrays and normalizes the mesh
 * to fit within [-1, 1]^3 centered at the origin.
 */

import { normalizeVertices } from './geometry.ts';

export interface ParsedSTL {
  /** Flat array of vertex positions [x1,y1,z1, x2,y2,z2, ...] */
  vertices: Float32Array;
  /** Flat array of face normals (one normal per face) */
  normals: Float32Array;
  /** Triangle indices into the vertex array */
  indices: Uint32Array;
}

/**
 * Detect whether an ArrayBuffer contains a binary or ASCII STL file.
 */
function isBinarySTL(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 84) {
    return false;
  }

  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  const expectedSize = 84 + triangleCount * 50;

  if (buffer.byteLength === expectedSize) {
    return true;
  }

  const header = new Uint8Array(buffer, 0, Math.min(80, buffer.byteLength));
  const headerStr = String.fromCharCode(...header.slice(0, 5));
  if (headerStr === 'solid') {
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(new Uint8Array(buffer, 0, Math.min(1000, buffer.byteLength)));
    if (text.includes('facet') || text.includes('endsolid')) {
      return false;
    }
  }

  return true;
}

/**
 * Parse a binary STL file.
 */
function parseBinarySTL(buffer: ArrayBuffer): ParsedSTL {
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  const vertexCount = triangleCount * 3;
  const rawVertices = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(triangleCount * 3);
  const indices = new Uint32Array(vertexCount);

  let offset = 84;

  for (let i = 0; i < triangleCount; i++) {
    normals[i * 3] = view.getFloat32(offset, true);
    normals[i * 3 + 1] = view.getFloat32(offset + 4, true);
    normals[i * 3 + 2] = view.getFloat32(offset + 8, true);
    offset += 12;

    for (let v = 0; v < 3; v++) {
      const vi = i * 3 + v;
      rawVertices[vi * 3] = view.getFloat32(offset, true);
      rawVertices[vi * 3 + 1] = view.getFloat32(offset + 4, true);
      rawVertices[vi * 3 + 2] = view.getFloat32(offset + 8, true);
      offset += 12;
      indices[vi] = vi;
    }

    offset += 2; // skip attribute byte count
  }

  return {
    vertices: normalizeVertices(rawVertices),
    normals,
    indices,
  };
}

/**
 * Parse an ASCII STL file.
 */
function parseAsciiSTL(buffer: ArrayBuffer): ParsedSTL {
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(buffer);

  const vertexList: number[] = [];
  const normalList: number[] = [];

  const facetPattern =
    /facet\s+normal\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+outer\s+loop\s+vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+endloop\s+endfacet/gi;

  let match: RegExpExecArray | null;
  while ((match = facetPattern.exec(text)) !== null) {
    normalList.push(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
    for (let v = 4; v <= 12; v++) {
      vertexList.push(parseFloat(match[v]));
    }
  }

  const triangleCount = normalList.length / 3;
  const rawVertices = new Float32Array(vertexList);
  const normals = new Float32Array(normalList);
  const indices = new Uint32Array(triangleCount * 3);

  for (let i = 0; i < indices.length; i++) {
    indices[i] = i;
  }

  return {
    vertices: normalizeVertices(rawVertices),
    normals,
    indices,
  };
}

/**
 * Parse an STL file (binary or ASCII) from an ArrayBuffer.
 * The resulting mesh is normalized to fit within [-1, 1]^3.
 * @param buffer Raw file contents
 */
export function parseSTL(buffer: ArrayBuffer): ParsedSTL {
  if (buffer.byteLength === 0) {
    throw new Error('STL file is empty');
  }

  if (isBinarySTL(buffer)) {
    return parseBinarySTL(buffer);
  }
  return parseAsciiSTL(buffer);
}
