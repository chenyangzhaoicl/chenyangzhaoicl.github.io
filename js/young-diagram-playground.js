(function () {
  "use strict";

  var presets = [
    { label: "(4,2,1)", value: [4, 2, 1] },
    { label: "(5,3,1)", value: [5, 3, 1] },
    { label: "(4,3,2,1)", value: [4, 3, 2, 1] },
    { label: "(3,3,2)", value: [3, 3, 2] },
    { label: "(3,2,1)", value: [3, 2, 1] }
  ];

  var state = {
    partition: [4, 2, 1],
    cornerKey: "1,1",
    selectedKey: "1,0",
    tab: "fixed",
    showOrdinary: true,
    showNested: true
  };

  function clonePartition(partition) {
    return partition.slice();
  }

  function pointKey(point) {
    return point.i + "," + point.j;
  }

  function fromKey(key) {
    var parts = key.split(",").map(function (value) {
      return parseInt(value, 10);
    });
    return { i: parts[0], j: parts[1] };
  }

  function normalizePartition(values) {
    var cleaned = values
      .map(function (value) {
        return Math.max(1, Math.min(7, parseInt(value, 10) || 1));
      })
      .slice(0, 6)
      .sort(function (a, b) {
        return b - a;
      });
    return cleaned.length ? cleaned : [1];
  }

  function samePoint(a, b) {
    return a.i === b.i && a.j === b.j;
  }

  function containsBox(partition, point) {
    return point.j >= 0 && point.j < partition.length && point.i >= 0 && point.i < partition[point.j];
  }

  function diagram(partition) {
    var boxes = [];
    partition.forEach(function (length, j) {
      for (var i = 0; i < length; i += 1) {
        boxes.push({ i: i, j: j });
      }
    });
    return boxes;
  }

  function removableCorners(partition) {
    return diagram(partition)
      .filter(function (box) {
        return !containsBox(partition, { i: box.i + 1, j: box.j }) &&
          !containsBox(partition, { i: box.i, j: box.j + 1 });
      })
      .sort(function (a, b) {
        return b.j - a.j || b.i - a.i;
      });
  }

  function canAdd(partition, point) {
    if (containsBox(partition, point) || point.i < 0 || point.j < 0) {
      return false;
    }
    var hasLeft = point.i === 0 || containsBox(partition, { i: point.i - 1, j: point.j });
    var hasBelow = point.j === 0 || containsBox(partition, { i: point.i, j: point.j - 1 });
    return hasLeft && hasBelow;
  }

  function addableBoxes(partition) {
    var maxI = partition[0] || 0;
    var maxJ = partition.length;
    var boxes = [];
    for (var j = 0; j <= maxJ; j += 1) {
      for (var i = 0; i <= maxI + 1; i += 1) {
        var point = { i: i, j: j };
        if (canAdd(partition, point)) {
          boxes.push(point);
        }
      }
    }
    return boxes.sort(function (a, b) {
      return a.j - b.j || a.i - b.i;
    });
  }

  function removeCorner(partition, corner) {
    var next = partition.map(function (length, j) {
      return j === corner.j ? length - 1 : length;
    });
    while (next.length && next[next.length - 1] === 0) {
      next.pop();
    }
    return next;
  }

  function armLeg(partition, box) {
    var arm = 0;
    var leg = 0;
    while (containsBox(partition, { i: box.i + arm + 1, j: box.j })) {
      arm += 1;
    }
    while (containsBox(partition, { i: box.i, j: box.j + leg + 1 })) {
      leg += 1;
    }
    return { arm: arm, leg: leg };
  }

  function partitionSize(partition) {
    return partition.reduce(function (sum, value) {
      return sum + value;
    }, 0);
  }

  function formatPartition(partition) {
    return "(" + partition.join(",") + ")";
  }

  function formatExponent(exp) {
    return exp === 1 ? "" : "<sup>" + exp + "</sup>";
  }

  function formatMonomial(point) {
    var pieces = [];
    if (point.i > 0) {
      pieces.push("x" + formatExponent(point.i));
    }
    if (point.j > 0) {
      pieces.push("y" + formatExponent(point.j));
    }
    return pieces.length ? pieces.join("") : "1";
  }

  function formatPoint(point) {
    return "(" + point.i + "," + point.j + ")";
  }

  function formatIdeal(partition) {
    return "(" + addableBoxes(partition).map(formatMonomial).join(", ") + ")";
  }

  function formatSpan(points) {
    if (!points.length) {
      return "0";
    }
    return "Span{" + points.map(formatMonomial).join(", ") + "}";
  }

  function weightToHtml(weight) {
    var pieces = [];
    if (weight.q !== 0) {
      pieces.push("q" + formatExponent(weight.q));
    }
    if (weight.t !== 0) {
      pieces.push("t" + formatExponent(weight.t));
    }
    return pieces.length ? pieces.join("") : "1";
  }

  function weightEqual(a, b) {
    return a.q === b.q && a.t === b.t;
  }

  function weightData(partition, corner, box) {
    var al = armLeg(partition, box);
    var ordinaryH = { q: al.arm + 1, t: -al.leg };
    var ordinaryV = { q: -al.arm, t: al.leg + 1 };
    var leftOfCorner = box.j === corner.j && box.i < corner.i;
    var belowCorner = box.i === corner.i && box.j < corner.j;
    var nestedH = leftOfCorner ? { q: al.arm, t: -al.leg } : ordinaryH;
    var nestedV = belowCorner ? { q: -al.arm, t: al.leg } : ordinaryV;
    return {
      arm: al.arm,
      leg: al.leg,
      leftOfCorner: leftOfCorner,
      belowCorner: belowCorner,
      ordinaryH: ordinaryH,
      ordinaryV: ordinaryV,
      nestedH: nestedH,
      nestedV: nestedV
    };
  }

  function selectedFallback(partition, corner) {
    var below = { i: corner.i, j: corner.j - 1 };
    var left = { i: corner.i - 1, j: corner.j };
    if (containsBox(partition, below)) {
      return below;
    }
    if (containsBox(partition, left)) {
      return left;
    }
    return diagram(partition)[0];
  }

  function ensureValidState() {
    state.partition = normalizePartition(state.partition);
    var corners = removableCorners(state.partition);
    if (!corners.some(function (corner) { return pointKey(corner) === state.cornerKey; })) {
      state.cornerKey = pointKey(corners[0]);
    }
    if (!containsBox(state.partition, fromKey(state.selectedKey))) {
      state.selectedKey = pointKey(selectedFallback(state.partition, fromKey(state.cornerKey)));
    }
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function setHtml(id, html) {
    byId(id).innerHTML = html;
  }

  function makePill(content, accent) {
    return '<span class="yd-pill' + (accent ? " is-accent" : "") + '">' + content + "</span>";
  }

  function renderControls() {
    var preset = byId("yd-preset");
    if (!preset.dataset.ready) {
      preset.innerHTML = presets.map(function (item, index) {
        return '<option value="' + index + '">' + item.label + "</option>";
      }).join("");
      preset.dataset.ready = "true";
    }
    var match = presets.findIndex(function (item) {
      return formatPartition(item.value) === formatPartition(state.partition);
    });
    preset.value = match >= 0 ? String(match) : "";

    byId("yd-row-inputs").innerHTML = state.partition.map(function (value, index) {
      return '<input type="number" min="1" max="7" value="' + value + '" data-row-index="' + index + '" aria-label="lambda row ' + (index + 1) + '">';
    }).join("");

    byId("yd-show-ordinary").checked = state.showOrdinary;
    byId("yd-show-nested").checked = state.showNested;

    var activeCorner = fromKey(state.cornerKey);
    byId("yd-corner-list").innerHTML = removableCorners(state.partition).map(function (corner) {
      var active = samePoint(corner, activeCorner);
      return '<button class="yd-corner-button' + (active ? " is-active" : "") + '" type="button" data-corner="' + pointKey(corner) + '">' +
        '<span>c = ' + formatPoint(corner) + '</span><strong>' + formatMonomial(corner) + '</strong></button>';
    }).join("");
  }

  function svgEl(tag, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (name) {
      el.setAttribute(name, attrs[name]);
    });
    return el;
  }

  function addSvgText(svg, x, y, text) {
    var el = svgEl("text", {
      x: x,
      y: y,
      class: "yd-axis-label"
    });
    el.textContent = text;
    svg.appendChild(el);
  }

  function renderSvg() {
    var partition = state.partition;
    var corner = fromKey(state.cornerKey);
    var selected = fromKey(state.selectedKey);
    var boxes = diagram(partition);
    var mu = removeCorner(partition, corner);
    var addables = addableBoxes(mu);
    var maxI = Math.max(partition[0] || 1, corner.i + 2, selected.i + 2) + 1;
    var maxJ = Math.max(partition.length + 1, corner.j + 2, selected.j + 2);
    var cell = 48;
    var pad = 34;
    var width = pad * 2 + maxI * cell;
    var height = pad * 2 + maxJ * cell;

    function xCoord(i) {
      return pad + i * cell;
    }

    function yCoord(j) {
      return pad + (maxJ - 1 - j) * cell;
    }

    function center(point) {
      return {
        x: xCoord(point.i) + cell / 2,
        y: yCoord(point.j) + cell / 2
      };
    }

    var svg = svgEl("svg", {
      class: "yd-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-label": "Young diagram for lambda " + formatPartition(partition)
    });

    var defs = svgEl("defs");
    [
      ["arrow-ordinary", "#717783"],
      ["arrow-nested-h", "#0a8f78"],
      ["arrow-nested-v", "#d7674e"]
    ].forEach(function (item) {
      var marker = svgEl("marker", {
        id: item[0],
        markerWidth: "7",
        markerHeight: "7",
        refX: "6",
        refY: "3.5",
        orient: "auto",
        markerUnits: "strokeWidth"
      });
      marker.appendChild(svgEl("path", {
        d: "M 0 0 L 7 3.5 L 0 7 z",
        fill: item[1]
      }));
      defs.appendChild(marker);
    });
    svg.appendChild(defs);

    for (var gi = 0; gi < maxI; gi += 1) {
      for (var gj = 0; gj < maxJ; gj += 1) {
        svg.appendChild(svgEl("rect", {
          x: xCoord(gi),
          y: yCoord(gj),
          width: cell,
          height: cell,
          class: "yd-grid-cell"
        }));
      }
    }

    addables.forEach(function (point) {
      svg.appendChild(svgEl("rect", {
        x: xCoord(point.i) + 4,
        y: yCoord(point.j) + 4,
        width: cell - 8,
        height: cell - 8,
        class: "yd-addable"
      }));
    });

    boxes.forEach(function (box) {
      var className = "yd-box";
      if (box.j === corner.j && box.i < corner.i) {
        className += " is-row-zone";
      }
      if (box.i === corner.i && box.j < corner.j) {
        className += " is-column-zone";
      }
      if (samePoint(box, corner)) {
        className += " is-corner";
      }
      if (samePoint(box, selected)) {
        className += " is-selected";
      }
      var rect = svgEl("rect", {
        x: xCoord(box.i),
        y: yCoord(box.j),
        width: cell,
        height: cell,
        class: className,
        "data-box": pointKey(box)
      });
      svg.appendChild(rect);
    });

    var selectedCenter = center(selected);
    svg.appendChild(svgEl("circle", {
      cx: selectedCenter.x,
      cy: selectedCenter.y,
      r: 6,
      class: "yd-dot"
    }));

    var cornerCenter = center(corner);
    svg.appendChild(svgEl("circle", {
      cx: cornerCenter.x,
      cy: cornerCenter.y,
      r: 5,
      class: "yd-corner-dot"
    }));

    function drawArrow(source, target, className, markerId, offset) {
      var start = center(source);
      var end = center(target);
      var dx = end.x - start.x;
      var dy = end.y - start.y;
      var length = Math.sqrt(dx * dx + dy * dy) || 1;
      var ox = offset ? (-dy / length) * offset : 0;
      var oy = offset ? (dx / length) * offset : 0;
      var path = svgEl("path", {
        d: "M " + (start.x + ox) + " " + (start.y + oy) + " L " + (end.x + ox) + " " + (end.y + oy),
        class: "yd-arrow " + className,
        "marker-end": "url(#" + markerId + ")"
      });
      svg.appendChild(path);
    }

    var data = weightData(partition, corner, selected);
    var hSourceOrdinary = { i: selected.i + data.arm + 1, j: selected.j };
    var hTarget = { i: selected.i, j: selected.j + data.leg };
    var vSourceOrdinary = { i: selected.i, j: selected.j + data.leg + 1 };
    var vTarget = { i: selected.i + data.arm, j: selected.j };
    var hSourceNested = data.leftOfCorner ? corner : hSourceOrdinary;
    var vSourceNested = data.belowCorner ? corner : vSourceOrdinary;

    if (state.showOrdinary) {
      drawArrow(hSourceOrdinary, hTarget, "ordinary", "arrow-ordinary", state.showNested ? -5 : 0);
      drawArrow(vSourceOrdinary, vTarget, "ordinary", "arrow-ordinary", state.showNested ? 5 : 0);
    }
    if (state.showNested) {
      drawArrow(hSourceNested, hTarget, "nested-h", "arrow-nested-h", 0);
      drawArrow(vSourceNested, vTarget, "nested-v", "arrow-nested-v", 0);
    }

    addSvgText(svg, xCoord(0), height - 8, "x");
    addSvgText(svg, 10, yCoord(maxJ - 1) + 14, "y");

    byId("yd-svg-wrap").innerHTML = "";
    byId("yd-svg-wrap").appendChild(svg);
  }

  function renderLabels() {
    var partition = state.partition;
    var corner = fromKey(state.cornerKey);
    var selected = fromKey(state.selectedKey);
    setHtml("yd-lambda-label", formatPartition(partition) + " | |&lambda;| = " + partitionSize(partition));
    setHtml("yd-mu-label", formatPartition(removeCorner(partition, corner)));
    setHtml("yd-selected-label", "s = " + formatPoint(selected) + " = " + formatMonomial(selected));
  }

  function renderFixedData() {
    var partition = state.partition;
    var corner = fromKey(state.cornerKey);
    var mu = removeCorner(partition, corner);
    var corners = removableCorners(partition);
    var addables = addableBoxes(mu);
    var quotientBasis = diagram(partition);
    var activeCornerKey = pointKey(corner);
    var activeAddable = addables.some(function (box) {
      return pointKey(box) === activeCornerKey;
    });

    byId("yd-fixed-data").innerHTML = [
      ["Fixed point", "I<sub>&lambda;</sub> &sub; I<sub>&lambda;\\c</sub> with c = " + formatPoint(corner) + " and m<sub>c</sub> = " + formatMonomial(corner)],
      ["Monomial ideals", "I<sub>&lambda;</sub> = " + formatIdeal(partition) + "<br>I<sub>&mu;</sub> = " + formatIdeal(mu)],
      ["Quotient basis", '<div class="yd-pill-row">' + quotientBasis.map(function (box) {
        return makePill(formatMonomial(box), samePoint(box, corner));
      }).join("") + "</div>"],
      ["Socle directions", formatSpan(corners) + '<div class="yd-pill-row">' + corners.map(function (box) {
        return makePill(formatPoint(box) + " " + formatMonomial(box), samePoint(box, corner));
      }).join("") + "</div>"],
      ["Generator directions", "Addable boxes of &mu; give the basis of I<sub>&mu;</sub>/(x,y)I<sub>&mu;</sub>." + '<div class="yd-pill-row">' + addables.map(function (box) {
        return makePill(formatPoint(box) + " " + formatMonomial(box), samePoint(box, corner));
      }).join("") + "</div>"],
      ["Same datum", activeAddable ? "The selected corner c is also the addable box of &mu; that recovers &lambda;." : "Choose another corner to recover &lambda; from &mu;."]
    ].map(function (row) {
      return "<dt>" + row[0] + "</dt><dd>" + row[1] + "</dd>";
    }).join("");
  }

  function renderWeightData() {
    var partition = state.partition;
    var corner = fromKey(state.cornerKey);
    var selected = fromKey(state.selectedKey);
    var data = weightData(partition, corner, selected);
    var hChanged = !weightEqual(data.ordinaryH, data.nestedH);
    var vChanged = !weightEqual(data.ordinaryV, data.nestedV);

    byId("yd-weight-data").innerHTML =
      '<div class="yd-weight-summary">' +
      '<div class="yd-pill-row">' +
      makePill("a(s) = " + data.arm, false) +
      makePill("ell(s) = " + data.leg, false) +
      makePill(data.leftOfCorner ? "s is left of c" : "not left of c", data.leftOfCorner) +
      makePill(data.belowCorner ? "s is below c" : "not below c", data.belowCorner) +
      "</div>" +
      '<div class="yd-weight-big">' +
      '<section class="yd-weight-card"><h3>Horizontal</h3>' +
      '<div class="yd-weight-pair"><span>ordinary <strong>' + weightToHtml(data.ordinaryH) + "</strong></span>" +
      '<span>nested <strong>' + weightToHtml(data.nestedH) + "</strong></span></div>" +
      '<span class="yd-status ' + (hChanged ? "changed" : "same") + '">' + (hChanged ? "divided by q" : "unchanged") + "</span></section>" +
      '<section class="yd-weight-card"><h3>Vertical</h3>' +
      '<div class="yd-weight-pair"><span>ordinary <strong>' + weightToHtml(data.ordinaryV) + "</strong></span>" +
      '<span>nested <strong>' + weightToHtml(data.nestedV) + "</strong></span></div>" +
      '<span class="yd-status ' + (vChanged ? "changed" : "same") + '">' + (vChanged ? "divided by t" : "unchanged") + "</span></section>" +
      "</div>" +
      '<dl class="yd-definition-list">' +
      "<dt>Rule</dt><dd>Boxes left of c replace q<sup>a+1</sup>t<sup>-ell</sup> by q<sup>a</sup>t<sup>-ell</sup>. Boxes below c replace q<sup>-a</sup>t<sup>ell+1</sup> by q<sup>-a</sup>t<sup>ell</sup>.</dd>" +
      "<dt>Dimension</dt><dd>There are two weights for each box in D(&lambda;), so dim T = 2|&lambda;| = " + (2 * partitionSize(partition)) + ".</dd>" +
      "</dl></div>";
  }

  function renderAllBoxData() {
    var partition = state.partition;
    var corner = fromKey(state.cornerKey);
    var selectedKey = state.selectedKey;
    var rows = diagram(partition).map(function (box) {
      var data = weightData(partition, corner, box);
      var changed = !weightEqual(data.ordinaryH, data.nestedH) || !weightEqual(data.ordinaryV, data.nestedV);
      return '<tr class="' + (pointKey(box) === selectedKey ? "is-selected" : "") + '">' +
        "<td>" + formatPoint(box) + "</td>" +
        "<td>" + data.arm + "</td>" +
        "<td>" + data.leg + "</td>" +
        "<td>" + weightToHtml(data.nestedH) + "</td>" +
        "<td>" + weightToHtml(data.nestedV) + "</td>" +
        "<td>" + (changed ? "shortened" : "same") + "</td>" +
        "</tr>";
    }).join("");

    byId("yd-all-box-data").innerHTML =
      '<table class="yd-mini-table"><thead><tr><th>s</th><th>a</th><th>ell</th><th>w1</th><th>w2</th><th></th></tr></thead><tbody>' +
      rows +
      "</tbody></table>";
  }

  function renderTabs() {
    document.querySelectorAll(".yd-tab").forEach(function (tab) {
      tab.classList.toggle("is-active", tab.dataset.tab === state.tab);
    });
    document.querySelectorAll(".yd-tab-panel").forEach(function (panel) {
      panel.classList.toggle("is-active", panel.dataset.panel === state.tab);
    });
  }

  function render() {
    ensureValidState();
    renderControls();
    renderLabels();
    renderSvg();
    renderFixedData();
    renderWeightData();
    renderAllBoxData();
    renderTabs();
  }

  function bindEvents() {
    byId("yd-preset").addEventListener("change", function (event) {
      var preset = presets[parseInt(event.target.value, 10)];
      if (preset) {
        state.partition = clonePartition(preset.value);
        state.cornerKey = pointKey(removableCorners(state.partition)[0]);
        state.selectedKey = pointKey(selectedFallback(state.partition, fromKey(state.cornerKey)));
        render();
      }
    });

    byId("yd-add-row").addEventListener("click", function () {
      var next = clonePartition(state.partition);
      next.push(Math.max(1, Math.min(next[next.length - 1] || 1, 2)));
      state.partition = normalizePartition(next);
      render();
    });

    byId("yd-remove-row").addEventListener("click", function () {
      if (state.partition.length > 1) {
        state.partition = state.partition.slice(0, -1);
        render();
      }
    });

    byId("yd-row-inputs").addEventListener("change", function (event) {
      if (!event.target.matches("input")) {
        return;
      }
      var values = Array.prototype.slice.call(byId("yd-row-inputs").querySelectorAll("input")).map(function (input) {
        return input.value;
      });
      state.partition = normalizePartition(values);
      render();
    });

    byId("yd-corner-list").addEventListener("click", function (event) {
      var button = event.target.closest("[data-corner]");
      if (button) {
        state.cornerKey = button.dataset.corner;
        state.selectedKey = pointKey(selectedFallback(state.partition, fromKey(state.cornerKey)));
        render();
      }
    });

    byId("yd-svg-wrap").addEventListener("click", function (event) {
      var box = event.target.closest("[data-box]");
      if (box) {
        state.selectedKey = box.dataset.box;
        render();
      }
    });

    byId("yd-show-ordinary").addEventListener("change", function (event) {
      state.showOrdinary = event.target.checked;
      render();
    });

    byId("yd-show-nested").addEventListener("change", function (event) {
      state.showNested = event.target.checked;
      render();
    });

    document.querySelectorAll(".yd-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        state.tab = tab.dataset.tab;
        renderTabs();
      });
    });
  }

  function init() {
    if (!document.getElementById("young-diagram-playground")) {
      return;
    }
    bindEvents();
    render();
  }

  if (typeof window !== "undefined") {
    window.YoungDiagramPlayground = {
      addableBoxes: addableBoxes,
      armLeg: armLeg,
      diagram: diagram,
      removableCorners: removableCorners,
      removeCorner: removeCorner,
      weightData: weightData
    };
    window.addEventListener("DOMContentLoaded", init);
  }
}());
