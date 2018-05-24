import React, { Component } from 'react';
import { LineChart as LineChartX, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Line as LineChart } from 'react-chartjs';
import { Document, Page } from 'react-pdf';
import jsPDF from 'jspdf';
import logo from './logo.svg';
import './App.css';
import { drawSVG, copyCanvas } from './renderChart';

const data = [
      {name: 'Page A', uv: 4000, pv: 2400, amt: 2400},
      {name: 'Page B', uv: 3000, pv: 1398, amt: 2210},
      {name: 'Page C', uv: 2000, pv: 9800, amt: 2290},
      {name: 'Page D', uv: 2780, pv: 3908, amt: 2000},
      {name: 'Page E', uv: 1890, pv: 4800, amt: 2181},
      {name: 'Page F', uv: 2390, pv: 3800, amt: 2500},
      {name: 'Page G', uv: 3490, pv: 4300, amt: 2100},
];

function chartData() {
  return {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'My First dataset',
        fillColor: 'rgba(220,220,220,0.2)',
        strokeColor: 'rgba(220,220,220,1)',
        pointColor: 'rgba(220,220,220,1)',
        pointStrokeColor: '#fff',
        pointHighlightFill: '#fff',
        pointHighlightStroke: 'rgba(220,220,220,1)',
        data: [65, 59, 80, 81, 56, 55, 40],
      },
      {
        label: 'My Second dataset',
        fillColor: 'rgba(151,187,205,0.2)',
        strokeColor: 'rgba(151,187,205,1)',
        pointColor: 'rgba(151,187,205,1)',
        pointStrokeColor: '#fff',
        pointHighlightFill: '#fff',
        pointHighlightStroke: 'rgba(151,187,205,1)',
        data: [28, 48, 40, 19, 86, 27, 90],
      },
    ]
  }
}

const options = {
  scaleShowGridLines: true,
  scaleGridLineColor: 'rgba(0,0,0,.05)',
  scaleGridLineWidth: 1,
  scaleShowHorizontalLines: true,
  scaleShowVerticalLines: true,
  bezierCurve: true,
  bezierCurveTension: 0.4,
  pointDot: true,
  pointDotRadius: 4,
  pointDotStrokeWidth: 1,
  pointHitDetectionRadius: 20,
  datasetStroke: true,
  datasetStrokeWidth: 2,
  datasetFill: true,
  legendTemplate: '<ul class="<%=name.toLowerCase()%>-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].strokeColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>',
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: chartData(),
      pageNumber: 1,
      numPages: 1,
    }

    this.chart1 = React.createRef();
    this.chart2 = React.createRef();
    this.chart3 = React.createRef();
    this.handleRender = this.handleRender.bind(this);
    this.handleDownload = this.handleDownload.bind(this);
    this.onDocumentLoad = this.onDocumentLoad.bind(this);
  }

  async getDoc() {
    let doc = new jsPDF('portrait', 'mm', 'a4'); // units are millimeters
                                                 // A4 measures 210 × 297 millimeters

    await drawSVG(doc, this.chart1, { x: 10, y: 25, width: 80 }); // scale to 80mm in width, height will be calculated
    await drawSVG(doc, this.chart2, { x: 110, y: 25, width: 80 });
    await copyCanvas(doc, this.chart3, { x: 50, y: 125, width: 80 });

    doc.setFontSize(12);
    doc.text(35, 100, 'Some text here');

    return doc;
  }

  async handleDownload() {
    let doc = await this.getDoc();
    doc.save('report.pdf');
  }

  async handleRender() {
    let doc = await this.getDoc();
    this.setState({
      pdf: doc.output('dataurlstring'),
    });
  }

  onDocumentLoad({ numPages }) {
    this.setState({ numPages, pageNumber: 1 });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <div style={{ display: 'flex', flexDirection: 'row', marginTop: '3em', justifyContent: 'center' }}>
          <div ref={this.chart1}>
            <LineChartX
              width={600}
              height={400}
              data={data}
              margin={{top: 5, right: 30, left: 20, bottom: 5}}
            >
              <XAxis dataKey="name"/>
              <YAxis/>
              <CartesianGrid strokeDasharray="3 3"/>
              <Tooltip/>
              <Legend />
              <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{r: 8}}/>
              <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
            </LineChartX>
          </div>
          <div ref={this.chart2}>
            <AreaChart 
              width={600}
              height={400}
              data={data}
              margin={{top: 10, right: 30, left: 0, bottom: 0}}
            >
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="name"/>
              <YAxis/>
              <Tooltip/>
              <Area type='monotone' dataKey='uv' stackId="1" stroke='#8884d8' fill='#8884d8' />
              <Area type='monotone' dataKey='pv' stackId="1" stroke='#82ca9d' fill='#82ca9d' />
              <Area type='monotone' dataKey='amt' stackId="1" stroke='#ffc658' fill='#ffc658' />
            </AreaChart>
          </div>
        </div>
        <div ref={this.chart3} style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          <LineChart data={this.state.data}
            options={options}
            width="600" height="250"/>
        </div>
        <div>
          <button onClick={this.handleRender} style={{ margin: '1em' }}>
            Render to PDF
          </button>
          <button onClick={this.handleDownload} style={{ margin: '1em' }}>
            Download
          </button>
        </div>
        <Document file={this.state.pdf} onLoadSuccess={this.onDocumentLoad}>
          <Page pageNumber={this.state.pageNumber} />
        </Document>
      </div>
    );
  }
}

export default App;
