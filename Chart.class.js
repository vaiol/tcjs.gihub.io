const c = 0;
const h = 1;

const generateLableChild = (div, count) => {
  while (div.firstChild) {
    div.removeChild(div.firstChild);
  }
  for (let i = 0; i < count; i++) {
    const n = document.createElement('div');
    n.appendChild(document.createElement('span'));
    n.appendChild(document.createElement('br'));
    n.appendChild(document.createElement('span'));
    div.appendChild(n);
  }
};

class Chart {
  constructor(name, div, dataSet) {
    this.chartName = name;
    this.div = div;
    this.canvas = div.querySelector('.chart');
    this.canvas.offscreenCanvas = window.OffscreenCanvas
      ? new OffscreenCanvas(this.canvas.width, this.canvas.height)
      : document.createElement('canvas');
    this.ctx = Array(2);
    this.canvas.ctx = this.canvas.getContext('2d');
    this.edges = {
      axis: [
        {
          x: {
            min: 0,
            max: 0,
          },
          y: {
            min: 0,
            max: 0,
          },
        },
        {
          x: {
            min: 0,
            max: 0,
          },
          y: {
            min: 0,
            max: 0,
          },
        },
      ],
      charts: [
        {
          min: 0,
          max: -Infinity,
        },
        {
          min: 0,
          max: -Infinity,
        },
      ],
    };
    this.prevX = 0;
    this.prevXi = 0;
    this.chart = {
      lineWidth: 2 * window.devicePixelRatio,
    };
    this.ani = {
      alpha: 5,
      step: 5,
      raf: null,
    };
    this.cursor = {
      borderColor: '#364555',
      background: '#242f3e',
      label: '#253242',
      labelColor: '#FFF',
      ctx: null,
      canvas: null,
      ctx2: null,
      canvas2: null,
      width: 1,
      color: '#576776',
      div: document.querySelector('#label'),
    };
    this.h = {
      ctx: null,
      canvas: null,
      canvas2: null,
      background: '#242f3e',
      backgroundRound: '#596a74',
      xWidth: 10 * window.devicePixelRatio,
      yWidth: 2 * window.devicePixelRatio,
      handle: null,
      handleX: 0,
    };
    let cnv = div.querySelector('.xGrade');
    this.xGrades = {
      prefer: 2,
      count: 0,
      cnv,
      ctx: cnv.getContext('2d'),
      data: Array(2),
      points: Array(2),
      aPoints: Array(2),
      animation: false,
      alpha: 5,
      height: this.canvas.height - this.canvas.height / 14,
    };

    cnv = div.querySelector('.grade');
    this.grades = {
      count: 6,
      step: 1,
      data: [Array(6), Array(6)],
      points: [Array(6), Array(6)],
      aPoints: [Array(6), Array(6)],
      width: 1,
      color: '#576776',
      cnv,
      ctx: cnv.getContext('2d'),
      min: 0,
      max: 0,
      diff: 1,
      shades: 5,
      path: 0,
      animation: true,
    };
    this.text = {
      font: '25px Arial',
      fillStyle: '#546778',
    };
    this._calculateMinMaxAxis();
    // set data set
    this.x = dataSet.x;
    this.lines = dataSet.lines;
    this.charts = dataSet.charts;
    this.start = 0;
    this.end = this.x.data.length - 1;
    // add buttons
    this.addButtons(div.querySelector('.buttons'));
    this.div.querySelector('h1').innerHTML = this.chartName;
    return this;
  }

  setColors({ grade, handler, cursor, label, labelColor, color, handlerColor, buttonBackground }) {
    this.grades.color = grade || this.grades.color;
    this.h.background = handler || this.h.color;
    this.h.backgroundRound = handlerColor || this.h.backgroundRound;
    this.cursor.background = cursor || this.cursor.background;
    this.cursor.borderColor = buttonBackground || this.cursor.borderColor;
    this.cursor.label = label || this.cursor.label;
    this.cursor.labelColor = labelColor || this.cursor.labelColor;
    if (color) {
      this.div.style.color = color;
    }
    this.grades.color = grade || this.grades.color;
    this.addButtons(this.div.querySelector('.buttons'));
    return this;
  }

  _drawHandlerLine() {
    this.h.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.h.ctx.beginPath();
    this.h.ctx.fillStyle = this.h.background;

    this.h.ctx.lineWidth = this.h.yWidth;

    this.h.ctx.globalAlpha = 0.7;
    this.h.ctx.fillRect(0, 0, this.x.points[h][this.start], this.h.canvas.height);
    this.h.ctx.fillRect(
      this.x.points[h][this.end],
      0,
      this.h.canvas.width - this.x.points[h][this.end],
      this.h.canvas.height,
    );

    this.h.ctx.fillStyle = this.h.backgroundRound;

    this.h.ctx.globalAlpha = 0.5;
    this.h.ctx.fillRect(this.x.points[h][this.start], 0, this.h.xWidth, this.h.canvas.height);
    this.h.ctx.fillRect(
      this.x.points[h][this.end] - this.h.xWidth,
      0,
      this.h.xWidth,
      this.h.canvas.height,
    );
    this.h.ctx.fillRect(
      this.x.points[h][this.start] + this.h.xWidth,
      0,
      this.x.points[h][this.end] - this.x.points[h][this.start] - this.h.xWidth * 2,
      this.h.yWidth,
    );
    this.h.ctx.fillRect(
      this.x.points[h][this.start] + this.h.xWidth,
      this.h.canvas.height - this.h.yWidth,
      this.x.points[h][this.end] - this.x.points[h][this.start] - this.h.xWidth * 2,
      this.h.yWidth,
    );
  }

  _calculateSqrt(n) {
    let p2 = 1;
    let i = 0;
    while (p2 <= n) {
      p2 <<= 2;
      i += 2;
    }
    p2 >>= 2;
    return p2;
  }

  _drawCursorLine(line, clientX, clientY) {
    const el = this.cursor.div.children[1];
    this.cursor.div.style.backgroundColor = this.cursor.label;
    this.cursor.div.style.color = this.cursor.labelColor;
    generateLableChild(el, this.lines.length);
    this.cursor.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // draw cursor circles
    let output = false;
    for (let i = 0, j = 0; i < this.lines.length; i++, j++) {
      if (!this.lines[i].selected) {
        continue;
      }
      this.cursor.ctx.lineWidth = this.chart.lineWidth;
      this.cursor.ctx.fillStyle = this.cursor.background;
      this.cursor.ctx.beginPath();
      this.cursor.ctx.strokeStyle = this.lines[i].color;
      this.cursor.ctx.arc(
        this.x.points[c][line],
        this.charts[i][c].points[line],
        10,
        0,
        2 * Math.PI,
      );
      this.cursor.ctx.fill();
      this.cursor.ctx.stroke();
      el.children[j].style.color = this.lines[i].color;
      el.children[j].children[0].innerHTML = this.lines[i].data[line];
      el.children[j].children[2].innerHTML = this.lines[i].name;
      output = true;
    }
    if (output) {
      this.cursor.div.firstElementChild.firstElementChild.innerHTML = `${
        this.x.data[line].weekDay
      }, ${this.x.data[line].month} ${this.x.data[line].day}`;
      this.cursor.div.style.display = 'block';
      const tmp =
        (window.innerWidth > 0 ? window.innerWidth : screen.width) -
        clientX -
        this.cursor.div.offsetWidth / 2;
      const pos = clientX + (tmp < 0 ? tmp : 0) - this.cursor.div.offsetWidth / 2;
      this.cursor.div.style.left = `${pos < 0 ? 0 : pos}px`;
      this.cursor.div.style.top = `${clientY}px`;
      this.cursor.ctx.strokeStyle = this.cursor.color;
      this.cursor.ctx.lineWidth = this.cursor.width;
      this.cursor.ctx.beginPath();
      this.cursor.ctx.moveTo(this.x.points[c][line], this.canvas.height / 10 + 5);
      this.cursor.ctx.lineTo(this.x.points[c][line], this.canvas.height - this.canvas.height / 10);
      this.cursor.ctx.stroke();
    }
  }

  _calculateXGrades() {
    let count = ~~(this.xGrades.prefer / ((this.end + 1 - this.start) / this.x.data.length));
    if (this.xGrades.count === count) {
      return;
    }
    this.xGrades.count = count;
    if (count > this.x.data.length) {
      count = Math.ceil(this.x.data.length);
    }
    const step = this._calculateSqrt(Math.floor(this.x.data.length / count));
    const dates = Array(count);
    for (let i = 0, j = 0; i < this.x.data.length; i += step, j++) {
      dates[j] = i;
    }
    this.xGrades.data[1] = this.xGrades.data[0];
    this.xGrades.data[0] = dates;
    this.xGrades.alpha = 0;
    this.xGrades.ani = true;
  }

  _convertToText(num) {
    if (num > 1000000) {
      return `${~~(num / 100000) / 10}M`;
    }
    if (num > 1000) {
      return `${~~(num / 100) / 10}K`;
    }
    return num;
  }

  _drawYGradeLine(n, i, points) {
    this.grades.ctx.moveTo(0, this.grades[points][n][i]);
    this.grades.ctx.lineTo(this.canvas.width, this.grades[points][n][i]);
    this.grades.ctx.fillText(
      this._convertToText(this.grades.data[n][i]),
      0,
      this.grades[points][n][i] - 10,
    );
  }

  _drawYGrade(n) {
    let completed = 0;
    this.grades.ctx.beginPath();
    for (let i = 0; i < this.grades.points[n].length; i++) {
      const diff = this.grades.points[n][i] - this.grades.aPoints[n][i];
      if (Math.abs(diff) < 7) {
        this._drawYGradeLine(n, i, 'points');
        completed++;
        continue;
      }
      if (diff < 0) {
        this.grades.aPoints[n][i] += Math.floor(diff / this.ani.step);
      } else {
        this.grades.aPoints[n][i] += Math.ceil(diff / this.ani.step);
      }
      this._drawYGradeLine(n, i, 'aPoints');
    }
    this.grades.ctx.stroke();
    return completed;
  }

  _drawYGrades() {
    if (!this.grades.animation) {
      return true;
    }
    this.grades.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.grades.shades =
      this.grades.shades >= 4.5 ? (this.grades.shades = 5) : this.grades.shades + 0.5;
    this.grades.ctx.globalAlpha = this.grades.shades / 10;
    const completed = this._drawYGrade(0);
    this.grades.ctx.globalAlpha = 0.5 - this.grades.shades / 10;
    this._drawYGrade(1);

    if (completed === this.grades.points[0].length && this.grades.shades === 5) {
      this.grades.ani = false;
      return true;
    }
    return true;
  }

  _drawXText(n) {
    this.xGrades.ctx.beginPath();
    for (let i = 0; i < this.xGrades.data[n].length; i++) {
      const g = this.xGrades.data[n][i];
      if (g !== undefined) {
        const str = `${this.x.data[g].month} ${this.x.data[g].day}`;
        this.xGrades.ctx.fillText(str, this.x.aPoints[g], this.xGrades.height);
      }
    }
    this.xGrades.ctx.stroke();
  }

  _drawXGrades() {
    this.xGrades.alpha =
      this.xGrades.alpha >= 4.5 ? (this.xGrades.alpha = 5) : this.xGrades.alpha + 0.5;
    this.xGrades.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.xGrades.ctx.globalAlpha = this.xGrades.alpha / 10;
    this._drawXText(0);

    if (this.xGrades.data[1]) {
      this.xGrades.ctx.globalAlpha = 0.5 - this.xGrades.alpha / 10;
      this._drawXText(1);
      if (this.xGrades.ctx.globalAlpha === 5) {
        this.xGrades.data[1] = null;
      }
    }
  }

  _animationFrame() {
    this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx[c].clearRect(0, 0, this.canvas.width, this.canvas.height);
    let completedAll = 0;
    const xComp = this._animationX();
    for (let i = 0; i < this.lines.length; i++) {
      if (!this.charts[i][c].ani) {
        this._printLineC(i, 'points');
        completedAll++;
        continue;
      }
      this._animationTickChart(i);
    }
    this.canvas.ctx.drawImage(this.canvas.offscreenCanvas, 0, 0);
    const comp = this._drawYGrades();
    this._drawXGrades();
    // this.canvas.ctx.transferFromImageBitmap(this.canvas.offscreenCanvas.transferToImageBitmap());
    if (completedAll === this.lines.length && comp && xComp) {
      this.ani.raf = null;
    } else {
      this.ani.raf = requestAnimationFrame(() => this._animationFrame());
    }
  }

  _animationX() {
    let r = 0;
    for (let i = 0; i < this.x.data.length; i++) {
      const diff = this.x.points[c][i] - this.x.aPoints[i];
      if (diff < 0) {
        this.x.aPoints[i] += Math.floor(diff / this.ani.step);
      } else {
        this.x.aPoints[i] += Math.ceil(diff / this.ani.step);
      }
      r += Math.abs(diff);
    }
    if (r <= this.x.data.length) {
      for (let i = 0; i < this.x.data.length; i++) {
        this.x.aPoints[i] = this.x.points[c][i];
      }
      return true;
    }
    return false;
  }

  _animationTickChart(line) {
    let lDiff = 0;
    for (let i = 0; i < this.lines[line].data.length; i++) {
      const diff = this.charts[line][c].points[i] - this.charts[line][c].aPoints[i];
      if (diff < 0) {
        this.charts[line][c].aPoints[i] += Math.floor(diff / this.ani.step);
      } else {
        this.charts[line][c].aPoints[i] += Math.ceil(diff / this.ani.step);
      }
      lDiff += Math.abs(diff);
    }
    if (!this.lines[line].selected && this.charts[line][c].alpha > 0) {
      this.charts[line][c].alpha -= this.ani.alpha;
    } else if (this.lines[line].reselected && this.charts[line][c].alpha < 10) {
      this.charts[line][c].alpha += this.ani.alpha;
    } else if (lDiff < this.charts[line][c].aPoints.length) {
      this.charts[line][c].ani = false;
    }
    this._printLineC(line, 'aPoints');
  }

  _calculateYGrades() {
    let s = 5;
    if (this.edges.charts[c].max > 1000000) {
      s = 200000;
    } else if (this.edges.charts[c].max > 1000) {
      s = 200;
    }
    this.grades.diff = this.edges.charts[c].max - this.grades.max;
    if (Math.abs(this.grades.diff) <= s) {
      return;
    }
    let { min, max } = this.edges.charts[c];
    const tmp = (max - min) / (this.grades.count - 1);
    if (tmp > 50) {
      this.grades.step = ~~(tmp / 10) * 10;
    } else {
      this.grades.step = ~~tmp;
    }
    max -= max % this.grades.step;
    let i = 0;
    while (min <= max) {
      this.grades.data[1][i] = this.grades.data[0][i];
      this.grades.points[1][i] = this._calculateYCoordinate(this.grades.data[1][i], c);
      this.grades.aPoints[1][i] = this.grades.points[0][i];
      this.grades.data[0][i] = min;
      this.grades.points[0][i] = this._calculateYCoordinate(this.grades.data[0][i], c);
      this.grades.aPoints[0][i] = this._calculateYCoordinate(
        this.grades.data[0][i],
        c,
        this.grades.max,
      );
      i += 1;
      min += this.grades.step;
    }
    this.grades.ani = true;
    this.grades.shades = 0;
    this.grades.max = this.edges.charts[c].max;
  }

  _animationFrame2() {
    this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx[h].clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx[c].clearRect(0, 0, this.canvas.width, this.canvas.height);
    let completedAll = 0;
    for (let i = 0; i < this.lines.length; i++) {
      if (!this.charts[i][c].ani) {
        this._printLineC(i, 'points');
        completedAll++;
      } else {
        this._animationTickChart(i);
      }
      if (!this.charts[i][h].ani) {
        this._printLineH(i, 'points');
        completedAll++;
      } else {
        this._animationTickHandler(i);
      }
    }
    this.canvas.ctx.drawImage(this.canvas.offscreenCanvas, 0, 0);
    this._drawYGrades();
    this._drawXGrades();
    if (completedAll === this.lines.length * 2) {
      this.ani.raf = null;
    } else {
      this.ani.raf = requestAnimationFrame(() => this._animationFrame2());
    }
  }

  _animate(both) {
    if (this.ani.raf) {
      window.cancelAnimationFrame(this.ani.raf);
      this.ani.raf = null;
    }
    if (both) {
      this.ani.raf = requestAnimationFrame(() => this._animationFrame2());
    } else {
      this.ani.raf = requestAnimationFrame(() => this._animationFrame());
    }
  }

  _printLineC(line, points) {
    if (this.charts[line][c].alpha / 10 === 0) {
      return;
    }
    this.ctx[c].beginPath();
    this.ctx[c].strokeStyle = this.lines[line].color;
    this.ctx[c].lineWidth = this.chart.lineWidth;
    this.ctx[c].globalAlpha = this.charts[line][c].alpha / 10;
    this.ctx[c].moveTo(this.x.aPoints[0], this.charts[line][c][points][0]);
    for (let i = 1; i < this.charts[line][c][points].length; i++) {
      this.ctx[c].lineTo(this.x.aPoints[i], this.charts[line][c][points][i]);
    }
    this.ctx[c].stroke();
  }

  _printLineH(line, points) {
    if (this.charts[line][h].alpha / 10 === 0) {
      return;
    }
    this.ctx[h].beginPath();
    this.ctx[h].strokeStyle = this.lines[line].color;
    this.ctx[h].lineWidth = this.chart.lineWidth;
    this.ctx[h].globalAlpha = this.charts[line][h].alpha / 10;
    this.ctx[h].moveTo(this.x.points[h][0], this.charts[line][h][points][0]);
    for (let i = 1; i < this.charts[line][h][points].length; i++) {
      this.ctx[h].lineTo(this.x.points[h][i], this.charts[line][h][points][i]);
    }
    this.ctx[h].stroke();
  }

  /* CALCULATION MINIMUM AND MAXIMUM */

  _calculateMinMaxAxis() {
    this.edges.axis[c].x.min = 0;
    this.edges.axis[c].x.max = this.canvas.width;
    this.edges.axis[c].y.min = this.canvas.height / 10;
    this.edges.axis[c].y.max = this.canvas.height - this.canvas.height / 10;
  }

  _calculateMinMax() {
    for (let i = 0; i < this.lines.length; i++) {
      if (!this.lines[i].selected) {
        continue;
      }
      let [min, max] = [Infinity, -Infinity];
      for (let j = this.start; j <= this.end; j++) {
        if (this.lines[i].data[j] < min) {
          min = this.lines[i].data[j];
        }
        if (this.lines[i].data[j] > max) {
          max = this.lines[i].data[j];
        }
      }
      this.charts[i][c].min = min;
      this.charts[i][c].max = max;
    }
  }

  _calculateHandler() {
    for (let i = 0; i < this.lines.length; i++) {
      this.charts[i][h].min = this.charts[i][c].min;
      this.charts[i][h].max = this.charts[i][c].max;
      this.charts[i][h].points = this.charts[i][c].points.map(p => Object.assign({}, p));
    }
    this.x.points[h] = [...this.x.points[c]];
  }

  _calculateMaxData(field = c) {
    let newMax = -Infinity;
    let calculated = false;
    for (let i = 0; i < this.lines.length; i++) {
      if (!this.lines[i].selected) {
        continue;
      }
      if (this.charts[i][field].max > newMax) {
        newMax = this.charts[i][field].max;
      }
      calculated = true;
    }
    if (calculated) {
      this.edges.charts[field].max = newMax;
    }
  }

  _calculateMinData() {
    let min = Infinity;
    for (let i = 0; i < this.lines.length; i++) {
      if (this.charts[i][c].min < min) {
        min = this.charts[i][c].min;
      }
    }
    let tmp = this.edges.charts[c].max - min;
    let res = 0.1;
    while (tmp > 1) {
      tmp /= 10;
      res *= 10;
    }
    min -= min % res;
    this.edges.charts[c].min = min;
    this.edges.charts[h].min = min;
  }

  /* CALCULATING */

  _calculateYCoordinate(value, type, max = this.edges.charts[type].max) {
    return ~~(
      this.edges.axis[type].y.max -
      ((value - this.edges.charts[type].min) *
        (this.edges.axis[type].y.max - this.edges.axis[type].y.min)) /
        (max - this.edges.charts[type].min)
    );
  }

  _calculateYPoints(type = c) {
    for (let i = 0; i < this.lines.length; i++) {
      for (let j = 0; j < this.charts[i][type].points.length; j++) {
        this.charts[i][type].points[j] = this._calculateYCoordinate(this.lines[i].data[j], type);
      }
      this.charts[i][type].ani = true;
    }
  }

  _calculateXPoints() {
    for (let i = 0; i < this.x.data.length; i++) {
      this.x.points[c][i] = ~~(
        (i - this.start) *
        ((this.edges.axis[c].x.max - this.edges.axis[c].x.min) / (this.end - this.start))
      );
    }
  }

  /* ANIMATIONS */

  _animationTickHandler(line) {
    let lDiff = 0;
    for (let i = 0; i < this.lines[line].data.length; i++) {
      const diff = this.charts[line][h].points[i] - this.charts[line][h].aPoints[i];
      if (diff < 0) {
        this.charts[line][h].aPoints[i] += Math.floor(diff / this.ani.step);
      } else {
        this.charts[line][h].aPoints[i] += Math.ceil(diff / this.ani.step);
      }
      lDiff += Math.abs(diff);
    }
    if (!this.lines[line].selected && this.charts[line][h].alpha > 0) {
      this.charts[line][h].alpha -= this.ani.alpha;
    } else if (this.lines[line].reselected && this.charts[line][h].alpha < 10) {
      this.charts[line][h].alpha += this.ani.alpha;
    } else if (Math.abs(lDiff) < this.charts[line][h].aPoints.length) {
      this.charts[line][h].ani = false;
    }
    this._printLineH(line, 'aPoints');
  }

  setCursor(canvas) {
    this.cursor.canvas = canvas;
    this.cursor.ctx = canvas.getContext('2d');
    return this;
  }

  setHandler(canvas, canvas2) {
    this.h.canvas = canvas;
    this.ctx[h] = canvas.getContext('2d');
    this.h.canvas2 = canvas2;
    this.h.ctx = canvas2.getContext('2d');
    return this;
  }

  setSize(width, height) {
    const cnvWidth = width * window.devicePixelRatio;
    const cnvHeight = height * window.devicePixelRatio;
    const styleWidth = `${width}px`;
    const styleHeight = `${height}px`;
    this.canvas.width = cnvWidth;
    this.canvas.height = cnvHeight;
    this.canvas.style.width = styleWidth;
    this.canvas.style.height = styleHeight;
    this.canvas.offscreenCanvas.width = cnvWidth;
    this.canvas.offscreenCanvas.height = cnvHeight;
    this.ctx[0] = this.canvas.offscreenCanvas.getContext('2d');
    // cursor
    this.cursor.canvas.width = cnvWidth;
    this.cursor.canvas.height = cnvHeight;
    this.cursor.canvas.style.width = styleWidth;
    this.cursor.canvas.style.height = styleHeight;
    this.cursor.canvas.width = cnvWidth;
    this.cursor.canvas.height = cnvHeight;
    this.cursor.canvas.style.width = styleWidth;
    this.cursor.canvas.style.height = styleHeight;
    // handler
    const heightCs = ~~(height / 7);
    this.h.canvas.width = cnvWidth;
    this.h.canvas.height = heightCs * window.devicePixelRatio;
    this.h.canvas.style.width = styleWidth;
    this.h.canvas.style.height = `${heightCs}px`;
    this.h.canvas2.width = cnvWidth;
    this.h.canvas2.height = heightCs * window.devicePixelRatio;
    this.h.canvas2.style.width = styleWidth;
    this.h.canvas2.style.height = `${heightCs}px`;
    this.edges.axis[h].x.min = 0;
    this.edges.axis[h].x.max = this.h.canvas.width;
    this.edges.axis[h].y.min = ~~(this.h.canvas.height / 5);
    this.edges.axis[h].y.max = this.h.canvas.height;
    // grade
    this.grades.cnv.width = cnvWidth;
    this.grades.cnv.height = cnvHeight;
    this.grades.cnv.style.width = styleWidth;
    this.grades.cnv.style.height = styleHeight;
    // xGrades
    this.xGrades.cnv.width = cnvWidth;
    this.xGrades.cnv.height = cnvHeight;
    this.xGrades.cnv.style.width = styleWidth;
    this.xGrades.cnv.style.height = styleHeight;
    this.xGrades.height = this.canvas.height - this.canvas.height / 14;
    // containers
    const containers = this.div.querySelectorAll('.container');
    for (let i = 0; i < containers.length; i++) {
      containers[i].style.width = styleWidth;
    }
    this._calculateMinMaxAxis();
    return this;
  }

  addButtons(div) {
    while (div.firstChild) {
      div.removeChild(div.firstChild);
    }
    div.style.color = this.cursor.labelColor;
    for (let i = 0; i < this.lines.length; i++) {
      const btn = document.createElement('button');
      const btnDiv = document.createElement('div');
      const btnDivDiv = document.createElement('div');
      const btnDivImg = document.createElement('img');
      const btnSpan = document.createElement('span');
      btnSpan.style.color = this.cursor.labelColor;
      btnSpan.innerText = this.lines[i].name;
      btnDivImg.src = 'icons/done.svg';
      btnDivImg.alt = 'btn';
      btnDivImg.style.backgroundColor = this.lines[i].color;
      btnDiv.style.borderColor = this.lines[i].color;
      btnDivDiv.style.backgroundColor = this.cursor.background;
      btnDiv.appendChild(btnDivImg);
      btnDiv.appendChild(btnDivDiv);
      btn.style.borderColor = this.cursor.borderColor;
      btn.appendChild(btnDiv);
      btn.appendChild(btnSpan);
      btn.addEventListener('click', () => {
        btnDiv.classList.toggle('disabled');
        this.turnLine(this.lines[i].name);
      });
      div.appendChild(btn);
      if (!this.lines[i].selected) {
        btnDiv.classList.toggle('disabled');
      }
    }
    return this;
  }

  render() {
    for (let i = 0; i < this.lines.length; i++) {
      if (!this.lines[i].selected) {
        continue;
      }
      this._printLineC(i, 'points');
      this._printLineH(i, 'points');
      this.charts[i][c].ani = false;
      this.charts[i][h].ani = false;
    }
    this._drawHandlerLine();
    this._drawYGrades();
    this.canvas.ctx.drawImage(this.canvas.offscreenCanvas, 0, 0);

    this.grades.ctx.strokeStyle = this.grades.color;
    this.grades.ctx.lineWidth = this.grades.width;
    this.grades.ctx.font = this.text.font;
    this.grades.ctx.fillStyle = this.text.fillStyle;
    this.grades.shades = 5;
    this.grades.ctx.globalAlpha = 0.5;
    this.grades.ctx.beginPath();
    for (let i = 0; i < this.grades.points[0].length; i++) {
      this.grades.aPoints[0][i] = this.grades.points[0][i];
      this._drawYGradeLine(0, i, 'points');
    }
    this.grades.ctx.stroke();
    // this._drawYGrades();
    // xGrades
    this.xGrades.ctx.strokeStyle = this.grades.color;
    this.xGrades.ctx.lineWidth = this.grades.width;
    this.xGrades.ctx.font = this.text.font;
    this.xGrades.ctx.fillStyle = this.text.fillStyle;
    this.xGrades.alpha = 5;
    this._drawXGrades();
    return this;
  }

  render2() {
    this._drawHandlerLine();
    return this;
  }

  calculate() {
    this.start = 0;
    this.end = this.x.data.length - 1;
    this._calculateMinMax();
    this._calculateMaxData();
    this._calculateMinData();

    this._calculateYGrades();
    this._calculateXPoints();
    this._calculateYPoints();
    this._calculateXGrades();
    this._calculateHandler();
    this._calculateMaxData(h);
    this._calculateYPoints(h);
    // for (let i = 0; i < this.grades.aPoints.length; i++) {
    //   this.grades.aPoints[i] = this.grades.points[i];
    // }
    for (let i = 0; i < this.x.aPoints.length; i++) {
      this.x.aPoints[i] = this.x.points[c][i];
    }
    for (let i = 0; i < this.lines.length; i++) {
      for (let j = 0; j < this.charts[i][h].points.length; j++) {
        this.charts[i][h].aPoints[j] = this.charts[i][h].points[j];
        this.charts[i][c].aPoints[j] = this.charts[i][c].points[j];
      }
    }
    return this;
  }

  setGrinds(start, end) {
    if (end - start < 2 || end > this.x.data.length || start < 0) {
      return this;
    }
    this.start = start;
    this.end = end;
    this._calculateMinMax();
    this._calculateMaxData();
    this._calculateYGrades();
    this._calculateXPoints();
    this._calculateYPoints();
    this._calculateXGrades();
    this._animate();
    this._drawHandlerLine();
    return this;
  }

  turnLine(line) {
    let turn = false;
    for (let i = 0; i < this.lines.length; i++) {
      if (this.lines[i].name === line) {
        if (this.lines[i].selected) {
          this.lines[i].selected = false;
          this.lines[i].reselected = false;
          this.charts[i][c].alpha = 10;
          this.charts[i][h].alpha = 10;
        } else {
          this.lines[i].selected = true;
          this.lines[i].reselected = true;
          this.charts[i][c].alpha = 0;
          this.charts[i][h].alpha = 0;
        }
        turn = true;
        break;
      }
    }
    if (turn) {
      this._calculateMinMax();
      this._calculateMaxData();
      this._calculateYGrades();
      this._calculateYPoints();
      this._calculateMaxData(h);
      this._calculateYPoints(h);
      this._animate(true);
    }
    return this;
  }

  onmousemove(event) {
    const canvasRect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - canvasRect.left) * (this.canvas.width / canvasRect.width);
    const distance = this.prevX - x;
    if (Math.abs(distance) < 5) {
      return;
    }
    this.prevX = x;
    const minDist = (this.x.points[c][1] - this.x.points[c][0]) / 2;
    let step = 1;
    if (distance < 0) {
      step = 1;
    } else {
      step = -1;
    }
    for (let i = this.prevXi; i < this.x.data.length && i >= 0; i += step) {
      const dist = Math.abs(this.x.points[c][i] - x);
      if (dist < minDist && this.prevXi !== i) {
        this.prevXi = i;
        this._drawCursorLine(
          i,
          event.clientX + (this.x.points[c][i] - x) / (this.canvas.width / canvasRect.width),
          canvasRect.top - document.body.getBoundingClientRect().top,
        );
        return i;
      }
    }
  }

  onmouseleave() {
    this.prevXi = 1;
    this.cursor.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.cursor.div.style.display = 'none';
  }

  _mouseDetection(x, prev) {
    const minDist = this.x.points[h][1] - this.x.points[h][0] / 2;
    if (x < 0 || x > this.h.canvas.width + minDist - 1) {
      return null;
    }
    for (let i = 0; i < this.x.data.length; i += 1) {
      const dist = Math.abs(this.x.points[h][i] - x);
      if (dist < minDist) {
        this.h.handleX = this.h.handleX - (this.x.points[h][prev] - this.x.points[h][i]);
        return i;
      }
    }
  }

  handlerdown(event) {
    const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
    this.cursor.div.style.display = 'none';
    const canvasRect = this.canvas.getBoundingClientRect();
    const x = (clientX - canvasRect.left) * (this.canvas.width / canvasRect.width);
    this.cursor.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.x.points[h][this.start] <= x && x <= this.x.points[h][this.start] + this.h.xWidth) {
      this.h.handle = 'left';
      this.h.handleX = x;
    } else if (this.x.points[h][this.end] - this.h.xWidth <= x && x <= this.x.points[h][this.end]) {
      this.h.handle = 'right';
      this.h.handleX = x;
    } else if (
      this.x.points[h][this.start] + this.h.xWidth < x &&
      x < this.x.points[h][this.end] - this.h.xWidth
    ) {
      this.h.handle = 'move';
      this.h.handleX = x;
    }
  }

  handlermove(event) {
    if (!this.h.handle) {
      return;
    }
    const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
    const canvasRect = this.canvas.getBoundingClientRect();
    const x = (clientX - canvasRect.left) * (this.canvas.width / canvasRect.width);
    const distance = this.h.handleX - x;
    if (Math.abs(distance) < 5) {
      return;
    }
    let s = this.start;
    let e = this.end;
    if (this.h.handle === 'move') {
      const xr = this.h.handleX;
      s = this._mouseDetection(this.x.points[h][this.start] - distance, this.start);
      e = this._mouseDetection(this.x.points[h][this.end] - distance, this.end);
      if (s !== null) {
        this.h.handleX = xr - (this.x.points[h][this.start] - this.x.points[h][s]);
      } else if (e !== null) {
        this.h.handleX = xr - (this.x.points[h][this.end] - this.x.points[h][e]);
      } else {
        this.h.handleX = xr;
      }
    } else if (this.h.handle === 'right') {
      e = this._mouseDetection(this.x.points[h][this.end] - distance, this.end);
    } else if (this.h.handle === 'left') {
      s = this._mouseDetection(this.x.points[h][this.start] - distance, this.start);
    }
    if (s !== null && e !== null && (s !== this.start || e !== this.end)) {
      this.setGrinds(s, e);
    }
  }

  handlerup() {
    this.h.handle = null;
    this.h.handleX = 0;
  }
}
