export default [
    {
        name:'项目信息',
        path:'/',
        level:0
    },
    {
        name: '实验设置',
        icon: 'home',
        path: '/home',
        level:1,
    },

    {
        icon: 'line-chart',
        name: '实时数据',
        level:1,
        children: [
            {
                path: '/realtime/linea',
                name: '吞吐量',
                level:1,
            },
        ]
    },
    {
        icon: 'line-chart',
        name: '离线分析',
        path:'/analysis',
        level:1,
    }, 
];