function findRoot(type, ref) {
  let getRoot = node => {
    if (node.tagName.match(new RegExp('^' + type + '$', 'i')))
      return node;
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        let sub = getRoot(node.children[i]);
        if (sub)
          return sub;
      }
    }
    return null;
  }

  return getRoot(ref.current)
}

async function canvasScreenshot(canvas) {
  if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value: function (callback, type, quality) {
        var canvas = this;
        setTimeout(function() {
          var binStr = atob( canvas.toDataURL(type, quality).split(',')[1] ),
          len = binStr.length,
          arr = new Uint8Array(len);

          for (var i = 0; i < len; i++ ) {
              arr[i] = binStr.charCodeAt(i);
          }

          callback( new Blob( [arr], {type: type || 'image/png'} ) );
        });
      }
    });
  }

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(blob => {
        try {
          let mem = new FileReader();
          mem.onload = e => resolve(e.target.result);
          mem.onerror = error => reject(error);
          mem.readAsDataURL(blob);
        } catch (error) {
          return reject(error);
        }
      });
    } catch (error) {
      return reject(error);
    }
  });
}

async function rasterizeSVG(ref) {
  let root = findRoot('svg', ref)
  if (!root)
    return {};

  const defaults = {
    'version': '1.1',
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
  };

  let svg = '<svg ';
  for (let i = 0; i < root.attributes.length; i++) {
    let name = root.attributes[i].name;
    let value = root.attributes[i].value;
    if (defaults[name])
      delete defaults[name];
    svg += name + '="' + value + '" ';
  }
  for(let name of Object.keys(defaults))
    svg += name + '="' + defaults[name] + '" ';
  svg = svg.trim() + '>' + root.innerHTML + '</svg>';

  let img = new Image();
  return new Promise((resolve, reject) => {
    try {
      img.onload = async () => {
        try {
          let canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          let ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          return resolve({
            image: await canvasScreenshot(canvas),
            width: img.width,
            height: img.height,
          });
        } catch (error) {
          return reject(error);
        }
      }
      img.onerror = error => reject(error);
      img.src = "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(svg))) 
    } catch (error) {
      return reject(error);
    }
  });
}

export async function drawSVG(doc, ref, params) {
  try {
    let { image, width, height } = await rasterizeSVG(ref);
    if (!image)
      return;

    let scale = width / height;
    if (params.width && !params.height) {
      params.height = params.width / scale;
    } else if (params.height && !params.width) {
      params.width = params.height * scale;
    } else if (!params.width && !params.height) {
      params.width = width;
      params.height = height;
    }

    doc.addImage(image, 'png', params.x || 0, params.y || 0, params.width, params.height);
  } catch (error) {
    console.error(error);
  }
}

export async function copyCanvas(doc, ref, params) {
  try {
    let canvas = findRoot('canvas', ref);
    if (!canvas)
      return;

    let image = await canvasScreenshot(canvas);
    if (!image)
      return;

    let scale = canvas.width / canvas.height;
    if (params.width && !params.height) {
      params.height = params.width / scale;
    } else if (params.height && !params.width) {
      params.width = params.height * scale;
    } else if (!params.width && !params.height) {
      params.width = canvas.width;
      params.height = canvas.height;
    }

    doc.addImage(image, 'png', params.x || 0, params.y || 0, params.width, params.height);
  } catch (error) {
    console.error(error);
  }
}
