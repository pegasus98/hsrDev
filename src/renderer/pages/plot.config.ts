interface ApiType {
    [key: string]: string[];
  }
export const plotTypeList= [
    {
        title: '单条数据分析',
        key: 'singleExp',
        children:[
            {
                title: '延迟时序分布',
                key: 'latency_timeseries',
                disabled:false
            },
            {
                title: 'QUIC BBR带宽',
                key: 'quicBW',
                disabled:false
            },
            {
                title: 'QUIC BBR拥塞窗口',
                key: 'quicCWND',
                disabled:false
            },
            {
                title: 'QUIC BBR RTT',
                key: 'quicRTT',
                disabled:false
            },
            {
                title: 'TCP BBR带宽',
                key: 'tcpBW',
                disabled:false
            },
            {
                title: 'TCP BBR拥塞窗口',
                key: 'tcpCWND',
                disabled:false
            },
            {
                title: 'TCP BBR RTT',
                key: 'tcpRTT',
                disabled:false
            }
        ]
    },
    {
        title:"多数据统计",
        key:'multiExp',
        children:[
            {
                title: 'Throughput',
                key: 'throughput',
                disabled:false
            },
            {
                title: '延迟CDF',
                key: 'latency_cdf',
                disabled:false
            },
            {
                title: '丢包CDF',
                key: 'losscdf',
                disabled:false
            }
        ]
    }
]

export const plotExpRel:ApiType={
    latency_cdf:['lat'],
    latency_timeseries:['lat'],
    throughput:['QUIC','TCP'],
    losscdf:['QUIC','TCP'],
    quicBW:['QUIC'],
    quicCWND:['QUIC'],
    quicRTT:['QUIC'],
    tcpBW:['TCP'],
    tcpCWND:['TCP'],
    tcpRTT:['TCP']
}

