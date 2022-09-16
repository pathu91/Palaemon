import { app, session, BrowserWindow, ipcMain, dialog } from "electron";
import { Lulu } from "../client/Types";
import path from "path";
import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 'electron-devtools-installer';


import * as k8s from "@kubernetes/client-node";
import * as cp from "child_process";
const fetch: any = (...args: any) =>
  import("node-fetch").then(({ default: fetch }: any) => fetch(...args));

import {
  setStartAndEndTime,
  formatClusterData,
  formatEvents,
  formatAlerts,
  parseNode,
  parsePod,
} from "./utils";

// metrics modules
import { formatMatrix } from "./metricsData/formatMatrix";
import { SvgInfo, SvgInfoObj } from "../client/Types";
// K8S API BOILERPLATE
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApiCore = kc.makeApiClient(k8s.CoreV1Api);
const k8sApiApps = kc.makeApiClient(k8s.AppsV1Api);

const PROM_URL = "http://127.0.0.1:9090/api/v1/";

const isDev: boolean = process.env.NODE_ENV === "development";
const portOpen: boolean = false;
// const PORT: string | number = process.env.PORT || 8080;

// this is to allow the BrowserWindow object to be referrable globally
// however, BrowserWindow cannot be created before app is 'ready'
let mainWindow: any = null;

const loadMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      // contextIsolation: false,
      devTools: isDev, //whether to enable DevTools
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../client/index.html"));
  console.log("Main Window loaded file index.html");

  // check to see if port 9090 is open
  const checkPort = () => {
    fetch('http://localhost:9090/')
      .then((res: any) => {
        console.log('status code in loadMainWindow is ', res.status);
        mainWindow.show();
      })
      .catch((err: Error) => {
        console.log('fetch to 9090 has failed in main.ts in loadMainWindow');
        const num = dialog.showMessageBoxSync({
          message: "Please make sure port-forwarding to 9090 is set up.",
          type: "warning",
          // Cancel returns 0, OK returns 1
          buttons: ["Cancel", "OK"],
          title: "Port 9090 missing",
          detail: "Open Port 9090 for prometheus, then click OK."
        });
        if(num === 1) checkPort();
        else if (num === 0) app.quit();
      });
  }
  checkPort();
};

app.on("ready", async () => {
  if(isDev){
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS];
    installExtension(
      extensions,
      {loadExtensionOptions: {allowFileAccess: true}, forceDownload: forceDownload}
    ).then((name:string) => {console.log(`Added Extension: ${name}`)})
     .then(loadMainWindow)
    //  .catch((err: Error) => {console.log('There was an Error: ', err)})
  }
  else loadMainWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// K8S API //

// get all info function for initial load and reloads

ipcMain.handle("getAllInfo", async (): Promise<any> => {
  // nodes
  const tempData: SvgInfo = {
    name: 'string',
    usage: 1,
    request: 0.9,
    limit: Math.random() + 1,
    parent: 'string',
    namespace: 'string',
  }
  const namespace = "default";
  try {
    const getNodes = await k8sApiCore.listNode(namespace);
    const nodeData = getNodes.body.items.map((node) => {
      return parseNode(node);
    }); // end of nodeData

    const getPods = await k8sApiCore.listPodForAllNamespaces();
    const podData = await Promise.all(
      getPods.body.items.map((pod) => parsePod(pod))
    );


    if (podData) {
      const newObj: Lulu = {
        Clusters: [
          {
            name: "test",
            usage: 1,
            limit: 1,
            request: 1,
            parent: "bob",
            namespace: "",
          },
        ],
        Nodes: nodeData,
        Pods: podData,
        Deployments: [tempData],
      };
      return newObj;
    }

  } catch (error) {
    return [tempData];
  }
});


// get nodes in cluster
ipcMain.handle("getNodes", async (): Promise<any> => {
  // dynamically get this from frontend later
  const namespace = "default";
  try {
    const data = await k8sApiCore.listNode(namespace);
    // console.log('THIS IS INDIVIDUAL NODE ', data.body.items[0]);
    // const formattedData: any = data.body.items.map(
    //   (pod) => pod?.metadata?.name
    // );

    // return formattedData;
    return data.body.items;
  } catch (error) {
    return console.log(`Error in getNodes function: ERROR: ${error}`);
  }
});

// get deployments in cluster
ipcMain.handle("getDeployments", async (): Promise<any> => {
  try {
    const data = await k8sApiApps.listDeploymentForAllNamespaces();
    const formattedData: any = data.body.items.map(
      (pod) => pod?.metadata?.name
    );
    // console.log("THIS IS DATA ", formattedData);
    return formattedData;
  } catch (error) {
    console.log(`Error in getDeployments function: ERROR: ${error}`);
  }
});

// get pods in cluster
ipcMain.handle("getPods", async (): Promise<any> => {
  try {
    // const data = await k8sApiCore.listPodForAllNamespaces();
    const data = await k8sApiCore.listPodForAllNamespaces();
    // console.log('THIS OS BODY.ITEMS ', data.body.items);
    const podNames: (string | undefined)[] = data.body.items.map(
      (pod) => pod?.metadata?.name
    );
    const node: (string | undefined)[] = data.body.items.map(
      (pod) => pod?.spec?.nodeName
    );
    const namespace: (string | undefined)[] = data.body.items.map(
      (pod) => pod?.metadata?.namespace
    );
    // console.log('I AM INEVITABLSDFSDFSDFSDFS: ', data.body.items[0])
    return { podNames, node, namespace };
  } catch (error) {
    return console.log(`Error in getPods function: ERROR: ${error}`);
  }
});

// COMMAND LINE //
// get events
ipcMain.handle("getEvents", async () => {
  try {
    const response: string = cp
      .execSync("kubectl get events --all-namespaces", {
        encoding: "utf-8",
      })
      .toString();
    return formatEvents(response);
  } catch (error) {
    return console.log(`Error in getEvents function: ERROR: ${error}`); // add return statement to make async () => on line 112 happy
  }
});

// PROMETHEUS API //

ipcMain.handle("getMemoryUsageByPods", async () => {
  const { startTime, endTime } = setStartAndEndTime();
  // const query = `http://127.0.0.1:9090/api/v1/query_range?query=sum(container_memory_working_set_bytes{namespace="default"}) by (pod)&start=2022-09-07T05:13:25.098Z&end=2022-09-08T05:13:59.818Z&step=1m`
  const interval = "15s";
  try {
    // startTime and endTime look like this

    // data interval

    // promQL query to api/v1 endpoint
    const query = `${PROM_URL}query_range?query=sum(container_memory_working_set_bytes{namespace="default"}) by (pod)&start=${startTime}&end=${endTime}&step=${interval}`;
    // fetch request
    const res = await fetch(query);
    const data = await res.json();

    // data.data.result returns matrix
    return formatMatrix(data.data);
  } catch (error) {
    console.log(`Error in getMemoryUsageByPod function: ERROR: ${error}`);
    return { err: error };
  }
});

// get alerts
ipcMain.handle("getAlerts", async (): Promise<any> => {
  try {
    const data: any = await fetch(`${PROM_URL}/rules`);
    const alerts: any = await data.json();
    return formatAlerts(alerts);
  } catch (error) {
    console.log(`Error in getAlerts function: ERROR: ${error}`);
  }
});
