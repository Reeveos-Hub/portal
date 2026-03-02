// Studio → Figma Plugin — Node Creator
// Creates real editable Figma nodes from a design_map.json

figma.showUI(__html__, { width: 400, height: 420 });

function hexToFigmaRGB(hex) {
  if (!hex) return null;
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  return { r, g, b };
}

function parseBorderRadius(br) {
  if (!br || br === '0px') return 0;
  const m = br.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

async function createImageFill(dataUri) {
  try {
    // Extract base64 data from data URI
    const parts = dataUri.split(',');
    if (parts.length < 2) return null;
    const base64 = parts[1];
    
    // Decode base64 to bytes
    const raw = figma.base64Decode(base64);
    const image = figma.createImage(raw);
    return {
      type: 'IMAGE',
      scaleMode: 'FILL',
      imageHash: image.hash,
    };
  } catch (e) {
    console.error('Image fill failed:', e);
    return null;
  }
}

let nodeCount = 0;

async function processNode(node, parent, imageData) {
  const x = node.x || 0;
  const y = node.y || 0;
  const w = node.w || 0;
  const h = node.h || 0;
  const tag = node.tag || 'div';

  if (w < 2 || h < 2) {
    // Still process children
    for (const child of (node.children || [])) {
      await processNode(child, parent, imageData);
    }
    return;
  }

  nodeCount++;
  if (nodeCount % 50 === 0) {
    figma.ui.postMessage({ type: 'progress', text: `Creating node ${nodeCount}...` });
  }

  const textContent = node.text || '';
  const hasText = textContent.trim().length > 0;
  const imgSrc = node.imgSrc || node.bgImage || null;
  const bgColor = node.bgColor;
  const borderW = node.borderWidth || 0;
  const borderColor = node.borderColor;
  const br = parseBorderRadius(node.borderRadius || '');
  const opacity = node.opacity;

  // Create a frame or rectangle for structural elements
  let figmaNode;

  if (hasText && !imgSrc && !bgColor && !borderW) {
    // Pure text node
    try {
      const text = figma.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      
      const fontSize = node.fontSize || 16;
      const fontWeight = node.fontWeight || '400';
      
      // Load appropriate font style
      let fontStyle = 'Regular';
      const w = parseInt(fontWeight);
      if (w >= 700) fontStyle = 'Bold';
      else if (w >= 500) fontStyle = 'Medium';
      
      try {
        await figma.loadFontAsync({ family: "Inter", style: fontStyle });
        text.fontName = { family: "Inter", style: fontStyle };
      } catch {
        text.fontName = { family: "Inter", style: "Regular" };
      }
      
      text.characters = textContent;
      text.fontSize = fontSize;
      text.x = x;
      text.y = y;
      text.resize(w, Math.max(h, fontSize + 4));
      
      if (node.color) {
        const rgb = hexToFigmaRGB(node.color);
        if (rgb) text.fills = [{ type: 'SOLID', color: rgb }];
      }
      
      text.name = `${tag}: ${textContent.slice(0, 30)}`;
      if (opacity !== undefined && opacity < 1) text.opacity = opacity;
      parent.appendChild(text);
      figmaNode = text;
    } catch (e) {
      console.error('Text creation failed:', e);
    }
  } else {
    // Rectangle/Frame for visual elements
    const rect = figma.createRectangle();
    rect.x = x;
    rect.y = y;
    rect.resize(w, h);
    
    // Corner radius
    if (br > 0) rect.cornerRadius = br;
    
    // Background fill
    if (bgColor) {
      const rgb = hexToFigmaRGB(bgColor);
      if (rgb) rect.fills = [{ type: 'SOLID', color: rgb }];
    } else {
      rect.fills = []; // Transparent
    }
    
    // Border/stroke
    if (borderW > 0 && borderColor) {
      const rgb = hexToFigmaRGB(borderColor);
      if (rgb) {
        rect.strokes = [{ type: 'SOLID', color: rgb }];
        rect.strokeWeight = borderW;
      }
    }
    
    // Image fill
    if (imgSrc) {
      const dataUri = imageData[imgSrc];
      if (dataUri) {
        const fill = await createImageFill(dataUri);
        if (fill) rect.fills = [fill];
      } else {
        // Placeholder for missing images
        rect.fills = [{ type: 'SOLID', color: { r: 0.91, g: 0.91, b: 0.91 } }];
      }
    }
    
    // Opacity
    if (opacity !== undefined && opacity < 1) rect.opacity = opacity;
    
    // Name
    const preview = textContent ? `: ${textContent.slice(0, 25)}` : '';
    rect.name = `${tag}${preview}`;
    
    parent.appendChild(rect);
    figmaNode = rect;
    
    // Add text on top of the rect if element has both bg and text
    if (hasText) {
      try {
        const text = figma.createText();
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        
        const fontSize = node.fontSize || 16;
        const fontWeight = node.fontWeight || '400';
        let fontStyle = 'Regular';
        const fw = parseInt(fontWeight);
        if (fw >= 700) fontStyle = 'Bold';
        else if (fw >= 500) fontStyle = 'Medium';
        
        try {
          await figma.loadFontAsync({ family: "Inter", style: fontStyle });
          text.fontName = { family: "Inter", style: fontStyle };
        } catch {
          text.fontName = { family: "Inter", style: "Regular" };
        }
        
        text.characters = textContent;
        text.fontSize = fontSize;
        text.x = x + 4;
        text.y = y + (h - fontSize) / 2;
        text.resize(w - 8, Math.max(h, fontSize + 4));
        
        if (node.color) {
          const rgb = hexToFigmaRGB(node.color);
          if (rgb) text.fills = [{ type: 'SOLID', color: rgb }];
        }
        
        text.name = `text: ${textContent.slice(0, 30)}`;
        parent.appendChild(text);
      } catch (e) {
        console.error('Overlay text failed:', e);
      }
    }
  }

  // Process children
  for (const child of (node.children || [])) {
    await processNode(child, parent, imageData);
  }
}


figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import') {
    try {
      const dm = msg.designMap;
      const page = dm.page || {};
      const root = dm.root;
      const imageData = dm.image_data || {};

      if (!root) {
        figma.ui.postMessage({ type: 'error', text: 'No root node found' });
        return;
      }

      const pageW = page.width || 1440;
      const pageH = page.height || 900;

      figma.ui.postMessage({ type: 'progress', text: 'Creating page frame...' });

      // Create a top-level frame
      const frame = figma.createFrame();
      frame.name = page.title || 'Studio Import';
      frame.resize(pageW, pageH);
      frame.x = 0;
      frame.y = 0;

      // Page background
      const bgRgb = hexToFigmaRGB(page.bgColor || '#ffffff');
      if (bgRgb) frame.fills = [{ type: 'SOLID', color: bgRgb }];

      // Disable auto-layout
      frame.layoutMode = 'NONE';
      frame.clipsContent = true;

      nodeCount = 0;
      figma.ui.postMessage({ type: 'progress', text: 'Building nodes...' });

      // Process all nodes
      await processNode(root, frame, imageData);

      // Zoom to frame
      figma.viewport.scrollAndZoomIntoView([frame]);

      figma.ui.postMessage({ type: 'done', count: nodeCount });
    } catch (e) {
      figma.ui.postMessage({ type: 'error', text: e.message || String(e) });
    }
  }
};
