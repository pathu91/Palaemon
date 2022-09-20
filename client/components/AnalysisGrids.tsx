import { Line } from "react-chartjs-2";
import { useState, useEffect } from "react";
import {
  GraphData,
  ChartGraphData,
  GraphableData,
  AnalysisGraphData,
} from "../Types";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AnalysisGrids = (props: any) => {
  const [buttonClicked, setButtonClicked] = useState(false);
  const initData: GraphData = [
    {
      Port9090isClosed: {
        times: ["a", "b", "c"],
        values: [1, 2, 3],
      },
    },
    {
      Port9090isClosedOpenIt: {
        times: ["a", "b", "c"],
        values: [3, 2, 1],
      },
    },
  ];

  const [graphState, setGraphState] = useState<AnalysisGraphData>({
    podMem: initData,
    podCPU: initData,
    networkRead: initData,
    networkWrite: initData,
  });

  const colorArray = [
    "red",
    "blue",
    "green",
    "black",
    "purple",
    "cyan",
    "yellow",
    "orange",
    "#003d33",
  ];

  const xLabels: string[] =
    graphState.podMem[0][Object.keys(graphState.podMem[0])[0]].times;

  let options: string = JSON.stringify({
    responsive: true,
    responsiveAnimationDuration: 1000,
    pointRadius: 0,
    indexAxis: "x",
    plugins: {
      legend: {
        display: buttonClicked,
        position: "bottom" as const,
      },
      title: {
        display: true,
        text: "working title",
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgb(240, 240, 240)",
        },
        ticks: {
          color: "#797676",
        },
        title: {
          display: true,
          text: new Date().toDateString(),
        },
      },
      y: {
        grid: {
          color: "rgb(240, 240, 240)",
        },
        ticks: {
          color: "#797676",
        },
        title: {
          display: true,
          text: "Mibibytes",
        },
      },
    },
  });

  const multiOptions = {
    podMem: JSON.parse(options),
    podCPU: JSON.parse(options),
    networkRead: JSON.parse(options),
    networkWrite: JSON.parse(options),
  };

  const charts: JSX.Element[] = [];
  let datasetData = [] as GraphableData[];
  let keyCounter: number = 0;
  //   console.log('a');
  //   console.log('multiopt', multiOptions);

  const handleLegendClick = () => {
    setButtonClicked((prevCheck) => !prevCheck);
  };

  // first we iterate of the total number of graphs we want
  (Object.keys(graphState) as (keyof typeof graphState)[]).forEach(
    (key, index) => {
      // console.log('whats this ', key, graphState[key], index);

      // then we iterate over all of the lines in that graph
      for (let i = 0; i < graphState[key].length; i++) {
        const podName: string = Object.keys(graphState[key][i])[0];
        datasetData.push({
          label: podName,
          backgroundColor: colorArray[i],
          borderColor: colorArray[i],
          data: graphState[key][i][podName].values,
        });
      }

      // this is part of the each individual graphs
      multiOptions[key].scales.y.title.text = "y-axis label";
      multiOptions[key].plugins.title.text = key;
      charts.push(
        <div
          className="line-chart-div"
          style={{
            position: "relative",
            // height: '40vh',
            // width: '30vw',
          }}
          key={70 + keyCounter++}
        >
          <Line
            options={multiOptions[key]}
            data={{
              labels: xLabels,
              datasets: datasetData,
            }}
            key={70 + keyCounter++}
            // width={300}
            // height={300}
          />
          <button className="legend-btn-grid" onClick={handleLegendClick}>
            Show/Hide
          </button>
        </div>
      );
      datasetData = [] as GraphableData[];
    }
  );

  return <>{charts}</>;
};

export default AnalysisGrids;