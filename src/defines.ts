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
    status: string;
    port: number;
  }
interface projectItemType {
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

export {
  ObjectType,
  projectDataType,
  MessageType,
  projectItemType,
  expItemType,
  throughputDataItem,
  serverInfoItem,
};
