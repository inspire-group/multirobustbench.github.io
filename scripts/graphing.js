var open_charts = {};
var ata_sorted_attacks = [];

const tooltipLine = {
    id: 'tooltipLine',
    beforeDraw: chart=> {
        if (chart.tooltip._active && chart.tooltip._active.length) {
            const ctx = chart.ctx;
            ctx.save();
            const activePoint_def = chart.tooltip._active[0];
            const activePoint_ata = chart.tooltip._active[1];
            const chartArea = chart.chartArea;

            ctx.beginPath();
            ctx.setLineDash([5,7]);
            ctx.moveTo(activePoint_ata.element.x, chartArea.top);
            ctx.lineTo(activePoint_ata.element.x, activePoint_ata.element.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#c4c8cf';
            ctx.stroke();
            ctx.moveTo(activePoint_ata.element.x, activePoint_def.element.y);
            ctx.lineTo(activePoint_ata.element.x, chartArea.bottom);
            ctx.stroke();
            ctx.restore();

            ctx.beginPath();
            ctx.moveTo(activePoint_ata.element.x, activePoint_ata.element.y);
            ctx.lineTo(activePoint_ata.element.x, activePoint_def.element.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#c4c8cf';
            ctx.stroke();
            ctx.restore();
        }
    }
}

function generateGraphHTML(value, selected_set) {
    var html = `<div class='container' style="display: flex">
        <div class='graph_container' style='width:50%'><canvas id="${value}_sc_multi" height="200"></canvas></div>
        <div class='container' style="flex-grow:1">
            <div class='graph_container'>${generateSingleSCSelect(value, selected_set)}</div>
            <div class='container' style="display: flex">
                <div class='graph_container style='width:50%'><canvas id="${value}_sc_single" height="200"></canvas></div>
                <div class='container' style="flex-grow:1">
                    <div class='graph_container'><canvas id="${value}_cr_in_out"  height="200"></canvas></div>
                </div>
            </div>
            <div class='graph_container'><canvas id="${value}_cr_single" height="100"></canvas></div>
        </div>
    </div>`;
    return html;
}

function generateSingleSCSelect(value, selected_set) {
    var select = `<label for="${value}_scselect">Attack type: </label><select name="${value}_scselect" class="graph_select" id="${value}_scselect" onchange="updateScPlot('${value}', ['${value}'])">`;
    for (const attack of selected_set) {
        select += `<option value="${attack}">${attacks[attack]}</option>`;
    }
    select += `</select>`
    return select;
}

function generateCompSCSelect(value, selected_set) {
    var select = `<label for="${value}_scselect">Attack type: </label><select name="${value}_scselect" class="graph_select" id="${value}_scselect" onchange="updateScPlot('${value}', def2comp)">`;
    for (const attack of selected_set) {
        select += `<option value="${attack}">${attacks[attack]}</option>`;
    }
    select += `</select>`
    return select;
}

function getDataFormat(graph_type, labels, datasets_names, datasets_data, colors) {
    if (graph_type == 'bar') {
        var datasets = [];
        for (var i = 0; i < datasets_names.length; i++) {
            const dataset = {'label': datasets_names[i],
                            'data': datasets_data[i],
                            'backgroundColor': 'rgba(' + colors[i] +', 0.2)',
                            'borderColor': 'rgba(' + colors[i] +', 1)',
                            'borderWidth': 1,
                            'hoverBackgroundColor': 'rgba(' + colors[i] +', 1)'
                        };
            datasets.push(dataset);
        }

        //console.log(datasets);

        const data = {
            'labels': labels,
            'datasets': datasets,
        };
        return data
    }
    else if (graph_type === 'line') {
        var datasets = [];
        for (var i = 0; i < datasets_names.length; i++) {
            const dataset = {'label': datasets_names[i],
                            'data': datasets_data[i],
                            'fill': false,
                            'backgroundColor': 'rgba(' + colors[i] +', 1)',
                            'borderColor': 'rgba(' + colors[i] +', 1)',
                            'tension': 0.1,
                            'pointHoverBorderColor': 'white',
                            'pointHoverBorderWidth': 2,
                            'pointHoverRadius': 5
                        };
            datasets.push(dataset);
        }
        const data = {
            'labels': labels,
            'datasets': datasets
        };
        return data;
    }
}

function getConfig(graph_type, labels, datasets_names, datasets_data, colors, x_ax_title, y_ax_title, title, eps_graph=false) {
    if (graph_type === 'bar') {
        const config = {
            type: 'bar',
            data: getDataFormat(graph_type, labels, datasets_names, datasets_data, colors),
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: y_ax_title
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: x_ax_title
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },
                    legend: {
                        display: false
                    }
                },
                interaction: {
                    intersect: false,
                    mode: "index"
                }
            }
        };
        return config;
    }
    else if (graph_type === 'line') {
        
        var title_fn = null
        var footer_fn = null;
        if (eps_graph) {
            title_fn = function(tooltipItem) { return `Eps: ${tooltipItem[0]['label']}`;};
        }
        else {
            title_fn = function(tooltipItem) {
                const point_info = ata_sorted_attacks[tooltipItem[0]['dataIndex']];
                if (point_info[0] !== 'No Attack') {
                    return `${point_info[0]}, Eps: ${point_info[1]}`;
                }
                else {
                    return `${point_info[0]}`;
                }
                
            }
        }
        if (datasets_names.length === 2) {
            footer_fn = function(tooltipItem) { return `Gap: ${Math.abs(dispNum(tooltipItem[1]['raw'] - tooltipItem[0]['raw']))}`;}
        }
        else {
            footer_fn = function(tooltipItem) {
                var diffs = [];
                for (var i = 1; i < tooltipItem.length; i++) {
                    diffs.push(Math.abs(dispNum(tooltipItem[i]['raw'] - tooltipItem[0]['raw'])));
                } 
                return `Gaps: ${diffs.join(", ")}`;
            }
        }

        const config = {
            type: 'line',
            data: getDataFormat(graph_type, labels, datasets_names, datasets_data, colors),
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: y_ax_title
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: x_ax_title
                        },
                        type: 'linear',
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },

                    legend: {
                        display: !eps_graph
                    },
                    
                    tooltip: {
                        callbacks: {
                            title: title_fn,
                            footer: footer_fn
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: "index"
                }
            },
            plugins: [tooltipLine]
          };
          
        return config;
    }
}

function generateSingleCRPlots(id, values, selected_set, cr_single_per_def, colors) {
    const ctx = document.getElementById(`${id}_cr_single`).getContext('2d');
    var data = [];
    for (const value of values) {
        data.push(cr_single_per_def[value]);
    }
    const config = getConfig('bar', selected_set, values, data,
         colors, "Attack Types", "Competitive Ratio", 'Single CR per Attack Type');
    const myChart = new Chart(ctx, config);
    if (!(id in open_charts)) {
        open_charts[id] = {}
    }
    open_charts[id]['cr_chart'] = myChart;
    
}

function generateCRInOutPlots(id, values, colors) {
    const ctx = document.getElementById(`${id}_cr_in_out`).getContext('2d');
    var data = [];
    for (const value of values) {
        data.push(cr_in_out_per_def[value]);
    }
    const config = getConfig('bar', ['CR in', 'CR out'], values, data,
         colors, "", "Competitive Ratio", 'CR on seen attacks (CR in) and unseen attacks (CR out)');
    const myChart = new Chart(ctx, config);
    if (!(id in open_charts)) {
        open_charts[id] = {}
    }
    open_charts[id]['cr_in_out_chart'] = myChart;
    
}

function getEpsAta(select_val, values) {
    var eps = [0];
    var accs = [];
    for (var i = 0 ; i < values.length + 1; i++) {
        if (i == 0) {
            // stores individual ATA accs
            accs.push([ata_accs['NoAttack']]);
        }
        else {
            accs.push([defense_data[values[i-1]]['Accuracies']['NoAttack']]);
        }
    }
    const eps_str = Object.keys(defense_data[values[0]]['Accuracies'][select_val]);
    for (const e of eps_str){
        eps.push(parseFloat(e));
        accs[0].push(ata_accs[select_val][e]);
        for (var i = 0 ; i < values.length; i++) {
            accs[i+1].push(defense_data[values[i]]['Accuracies'][select_val][e]);
        }
    }
    return [eps, accs];
}

function generateSingleSCPlots(id, values, colors) {
    const select_val = document.getElementById(`${id}_scselect`).value;
    const all_eps_ata = getEpsAta(select_val, values);
    const eps = all_eps_ata[0];
    const accs = all_eps_ata[1];
    const ctx = document.getElementById(`${id}_sc_single`).getContext('2d');

    var values_copy = JSON.parse(JSON.stringify(values));
    values_copy.unshift('Individual Adv Training');

    const config = getConfig('line', eps, values_copy, accs, colors,
    "Perturbation size", "Accuracy (%)", `Accuracy at Increasing Perturbation Size for ${attacks[select_val]} Attacks`, eps_graph=true);

    const myChart = new Chart(ctx, config);
    if (!(id in open_charts)) {
        open_charts[id] = {}
    }
    open_charts[id]['sc_chart'] = myChart;
    
}

function get_sorted_ata(values, selected_set) {
    var all_data_ata = [ata_accs['NoAttack']];
    var all_data_def = [];
    for (const value of values){
        all_data_def.push([defense_data[value]['Accuracies']['NoAttack']]);
    }
    //console.log(ata_accs['NoAttack']);
    ata_sorted_attacks = [['No Attack', 0]];
    for (const attack of selected_set) {
        const eps_values = Object.keys(defense_data[values[0]]['Accuracies'][attack]);
        for (const eps of eps_values) {
            ata_sorted_attacks.push([attacks[attack], dispNum(eps)]);
            all_data_ata.push(dispNum(ata_accs[attack][eps]));
            for (var i = 0; i < values.length; i++) {
                all_data_def[i].push(dispNum(defense_data[values[i]]['Accuracies'][attack][eps]));
            }
        }
    }
    // sort by increasing ata
    const order = argsort(all_data_ata);
    all_data_ata = order.map(i => all_data_ata[i]);
    for (var i = 0; i < values.length; i++) {
        all_data_def[i] = order.map(j => all_data_def[i][j]);
    }
    ata_sorted_attacks = order.map(i => ata_sorted_attacks[i]);
    return [all_data_ata, all_data_def];
}

function generateMultiSCPlots(id, values, selected_set, colors) {
    const all_data = get_sorted_ata(values, selected_set);
    const sorted_ata = all_data[0];
    const sorted_def = all_data[1];
    const ctx = document.getElementById(`${id}_sc_multi`).getContext('2d');
    
    var values_copy = JSON.parse(JSON.stringify(values));
    var sorted_def_copy = JSON.parse(JSON.stringify(sorted_def));

    values_copy.unshift('Individual Adv Training');
    sorted_def_copy.unshift(sorted_ata);

    const config = getConfig('line', sorted_ata, values_copy, sorted_def_copy, colors,
    "Individual Adversarial Training Accuracy (%)", `${id} Accuracy (%)`, `Accuracy at Increasing Individual Adv. Train Accuracy`, eps_graph=false);
    const myChart = new Chart(ctx, config);
    if (!(id in open_charts)) {
        open_charts[id] = {}
    }
    open_charts[id]['sc_multi_chart'] = myChart;

}

function updateScPlot(id, values) {
    //console.log(id);
    //console.log(values);
    //console.log(id);
    //console.log(values);
    var chart = open_charts[id]['sc_chart'];
    const select_val = document.getElementById(`${id}_scselect`).value;
    const all_eps_ata = getEpsAta(select_val, values);
    const eps = all_eps_ata[0];
    const accs = all_eps_ata[1];
    var values_copy = JSON.parse(JSON.stringify(values));
    values_copy.unshift('Individual Adv Training');
    const new_data = getDataFormat('line', eps, values_copy, accs, color_palette);
    chart.data = new_data;

    var footer_fn = null;
    if (values_copy.length === 2) {
        footer_fn = function(tooltipItem) { return `Gap: ${Math.abs(dispNum(tooltipItem[1]['raw'] - tooltipItem[0]['raw']))}`;}
    }
    else {
        footer_fn = function(tooltipItem) {
            var diffs = [];
            for (var i = 1; i < tooltipItem.length; i++) {
                diffs.push(Math.abs(dispNum(tooltipItem[i]['raw'] - tooltipItem[0]['raw'])));
            } 
            return `Gaps: ${diffs.join(", ")}`;
        }
    }

    chart.options.plugins.tooltip.callbacks.footer = footer_fn;

    chart.update();
}

function updateMultiScPlot(id, values, selected_set) {
    var chart = open_charts[id]['sc_multi_chart'];
    const all_data = get_sorted_ata(values, selected_set);
    const sorted_ata = all_data[0];
    const sorted_def = all_data[1];
    
    var values_copy = JSON.parse(JSON.stringify(values));
    var sorted_def_copy = JSON.parse(JSON.stringify(sorted_def));
    values_copy.unshift('Individual Adv Training');
    sorted_def_copy.unshift(sorted_ata);
    const new_data = getDataFormat('line', sorted_ata, values_copy, sorted_def_copy, color_palette);
    chart.data = new_data;

    var footer_fn = null;
    if (values_copy.length === 2) {
        footer_fn = function(tooltipItem) { return `Gap: ${Math.abs(dispNum(tooltipItem[1]['raw'] - tooltipItem[0]['raw']))}`;}
    }
    else {
        footer_fn = function(tooltipItem) {
            var diffs = [];
            for (var i = 1; i < tooltipItem.length; i++) {
                diffs.push(Math.abs(dispNum(tooltipItem[i]['raw'] - tooltipItem[0]['raw'])));
            } 
            return `Gaps: ${diffs.join(", ")}`;
        }
    }

    chart.options.plugins.tooltip.callbacks.footer = footer_fn;

    chart.update();
}

function updateCRPlot(id, values, selected_set, cr_single_per_def) {
    var chart = open_charts[id]['cr_chart'];
    var cr_single_data = [];
    for (const value of values) {
        cr_single_data.push(cr_single_per_def[value]);
    }
    var new_data = getDataFormat('bar', selected_set, values, cr_single_data, color_palette.slice(1));
    chart.data = new_data;
    chart.update();
}

function updateCRInOutPlot(id, values, cr_in_out_per_def) {
    var chart = open_charts[id]['cr_in_out_chart'];
    var data = [];
    for (const value of values) {
        data.push(cr_in_out_per_def[value]);
    }
    var new_data = getDataFormat('bar', ['CR in', 'CR out'], values, data, color_palette.slice(1));
    chart.data = new_data;
    chart.update();
}