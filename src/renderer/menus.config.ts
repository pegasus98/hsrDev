export default [
    {
        name: '实验设置',
        icon: 'home',
        path: '/'
    },
    {
        icon: 'line-chart',
        name: '实验数据',
        children: [
            {
                path: '/analysis/throughput',
                name: 'throughput'
            },
        ]
    }, 
];