interface ObjectType {
  [key: string]: any;
}
interface MessageType {
    bridgeName: string;
    data: any;
    cid: number;
  }

interface projectDataType {
  path: string;
  serverList: serverInfoItem[];
  projectList: projectItemType[];
}
interface serverInfoItem {
    ip: string;
    username: string;
    password: string;
    status: number;
    port: number;
  }
interface projectItemType {
  trace:number;
  index: string;
  deviceId: string;
  serverPath: string;
  serverIp: string;
  rat: string;
  expType: string;
  date: string;
  time: string;
  status1: number;
  status2: number;
  timeDur?: number;
}
interface expItemType {
  deviceId: string;
  serverPath: string;
  expType: string;
  status: string;
  speed?: number;
}
interface throughputDataItem {
  name: string;
  type: string;
  data: number[];
  expAppendList: string[];
}
interface LineDataItem {
  name: string;
  type: string;
  data: number[];
}
interface DetailLineDataItem{
  timestamp:number;
  time?:string;
  value:number;
}
interface snrLineDataItem{
  timestamp:number;
  value:number;
  rat:string
}
interface NumberLineDataItem{
  timestamp:number;
  value:number
}

interface HandoverDataItem{
  start:number;
  duration:number
  end:number;
  type:number;
}
interface DualDataItem{
  timestamp:number;
  time:string;
  first?:number;
  second?:number;
}
interface TagedDataItem{
  timestamp:number;
  type:string;
  value:number;
}

interface RbDataItem{
  timestamp:number;
  type:number;
  value:number;
  util:number
}

interface KernalDataItem{
  bltBw: number, // bottleneck bandwidth (Mbps)
  cwnd: number, // congestion window (MiB)
  minRtt: number, // minimum RTT (ms)
  stamp: number, // UNIX stamp (ms) in binary data (s)  in frontend
  time?:string,
}

interface QAckDataItem{
  rtt:number,
  stamp:number,
}
export {
  ObjectType,
  projectDataType,
  MessageType,
  projectItemType,
  expItemType,
  throughputDataItem,
  serverInfoItem,
  LineDataItem,
  DetailLineDataItem,
  NumberLineDataItem,
  HandoverDataItem,
  snrLineDataItem,
  KernalDataItem,
  DualDataItem,
  TagedDataItem,
  QAckDataItem,
  RbDataItem
};
