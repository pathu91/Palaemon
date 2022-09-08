import * as React from "react";
import { GraphProps } from "../Types";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Graph = (props: GraphProps): JSX.Element => {
  var ctx = document.getElementById("myChart") as HTMLCanvasElement;

  const datasetData = [];
  const colorArray = ["red", "blue", "green", "black", "purple", "cyan", "yellow", "orange"];
  
  const xLabels: string[] = props.data[0][Object.keys(props.data[0])[0]].times;
  
  for (let i = 0; i < props.data.length; i++) {
    const podName: string = Object.keys(props.data[i])[0];
    datasetData.push({
      label: podName,
      backgroundColor: colorArray[i],
      borderColor: colorArray[i],
      data: props.data[i][podName].values,
    });
  }

  const options: any = {
    responsive: true,
    pointRadius: 0,
    indexAxis: "x",
    plugins: {
      legend: {
        // display: buttonClicked,
        position: "bottom" as const,
      },
      datalabels: {
        // hide datalabels for all datasets
        display: false,
      },
    },
    scales: {
      // yAxes: [{
      //   scaleLabel: {
      //     display: true,
      //     labelString: 'probability'
      //   }
      // }],
      x: {
        grid: {
          color: "rgb(240, 240, 240)",
        },
        ticks: {
          color: "#797676",
        },
      },
      y: {
        grid: {
          color: "rgb(240, 240, 240)",
        },
        ticks: {
          color: "#797676",
        },
      },
    },
  };
  // const labels = ["January", "February", "March", "April", "May", "June"];

  const data = {
    labels: xLabels,
    datasets: datasetData,
  };
  // console.log('THIS IS final DATA OBJECT ', data)
  return (
    <>
      <Line options={options} data={data} />
    </>
  );
};

export default Graph;
