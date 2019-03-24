const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseX = (columnName, data) => {
  return {
    data: data.map(date => {
      const d = new Date(date);
      return {
        day: d.getDate(),
        weekDay: days[d.getDay()],
        month: months[d.getMonth()],
      };
    }),
    points: [Array(data.length), Array(data.length)],
    aPoints: Array(data.length),
  };
};

const parseLine = (columnName, data, fieldObj) => ({
  name: fieldObj.names[columnName],
  data,
  color: fieldObj.colors[columnName],
  selected: true,
  reselected: false,
});

const parseChart = data => [
  {
    points: Array(data.length),
    aPoints: Array(data.length),
    animation: false,
    min: Infinity,
    max: -Infinity,
    alpha: 10,
  },
  {
    points: Array(data.length),
    aPoints: Array(data.length),
    animation: false,
    min: Infinity,
    max: -Infinity,
    alpha: 10,
  },
];

const parseGroup = field => {
  const lines = [];
  const charts = [];
  let x;
  for (let i = 0; i < field.columns.length; i++) {
    const column = field.columns[i][0];
    const type = field.types[column];
    const data = field.columns[i].slice(1);
    if (type === 'line') {
      lines.push(parseLine(column, data, field));
      charts.push(parseChart(data));
    }
    if (type === 'x') {
      x = parseX(column, data);
    }
  }
  return { lines, x, charts };
};

const parseData = json => {
  const groups = [];
  for (let i = 0; i < json.length; i++) {
    groups.push(parseGroup(json[i]));
  }
  return groups;
};
