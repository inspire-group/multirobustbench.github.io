var selected_set;
var selected_set_names;
var cr_single_per_def;
var cr_in_out_per_def;
var isopen_def;
var def2comp = [];
var comparison_open = false;
var leaderboard;
//var attack_hist_avg = {}
//var attack_hist_worst = {}

function generateSelectMenu() {
    var select_menu = "<fieldset><legend>Attacks to use for metric computation:</legend>";
    for (let group in attack_grouping){
        if (groups_default_checked.includes(group)){
            select_menu += `<fieldset><legend><input type="checkbox" id="${group}_checkbox" name="${group}_checkbox" onchange="selectAll(this)" checked><label for="${group}_checkbox">${group}</label>:</legend>`;
        }
        else {
            select_menu += `<fieldset><legend><input type="checkbox" id="${group}_checkbox" name="${group}_checkbox" onchange="selectAll(this)"><label for="${group}_checkbox">${group}</label>:</legend>`;
        }
        for (const attack of attack_grouping[group]) {
            if (!attacks_outside_ranking.includes(attack)) {
                select_menu += `<input type="checkbox" id="${attack}_checkbox" name="${attack}_checkbox" checked><label for="${attack}_checkbox">${attacks[attack]}</label><br>`;
            }
            else {
                select_menu += `<input type="checkbox" id="${attack}_checkbox" name="${attack}_checkbox"><label for="${attack}_checkbox">${attacks[attack]}</label><br>`;
            }
        }
        select_menu += "</fieldset>"
    }
    select_menu += "</fieldset>"
    document.getElementById('select_block').innerHTML += select_menu;
}

function selectAll(obj) {
    //console.log(obj);
    var group_name = obj.id.split("_")[0]
    if (obj.checked) {
        for (const attack of attack_grouping[group_name]) {
            var attack_ckbx = document.getElementById(`${attack}_checkbox`);
            attack_ckbx.checked = true;
        }
    }
    else {
        for (const attack of attack_grouping[group_name]) {
            var attack_ckbx = document.getElementById(`${attack}_checkbox`);
            attack_ckbx.checked = false;
        }
    }
    //console.log(group_name);
    //console.log(obj.checked);
}


function generateCRMenu() {
    var cr_menu = '<fieldset><legend>Leaderboard selection:</legend>';
    var not_checked = true;
    for (let leaderboard_type in CR_settings) {
        if (not_checked) {
        cr_menu += `<input type="radio" id="${leaderboard_type}_checkbox" value="${leaderboard_type}" name="err_menu" onchange="switchLeaderboard()" checked><label for="${leaderboard_type}_checkbox"">${leaderboard_type}</label><br>`
        not_checked = false;
        }
        else {
            cr_menu += `<input type="radio" id="${leaderboard_type}_checkbox" value="${leaderboard_type}" name="err_menu" onchange="switchLeaderboard()"><label for="${leaderboard_type}_checkbox"">${leaderboard_type}</label><br>`
        }
    }
    cr_menu += "</fieldset>";
    /*
    cr_menu += '<fieldset><legend>Metric selection:</legend>';
    not_checked = true;
    for (let setting in CR_settings[Object.keys(CR_settings)[0]]) {
        if (not_checked){
            cr_menu += `<input type="radio" id="${setting}_checkbox" value="${setting}" name="err_menu2" checked><label for="${setting}_checkbox">${setting}</label><br>`
            not_checked = false;
        }
        else{
            cr_menu += `<input type="radio" id="${setting}_checkbox" name="err_menu2" value="${setting}"><label for="${setting}_checkbox">${setting}</label><br>`
         }
        
    }
    cr_menu += "</fieldset>";
    */
    document.getElementById("metric_block").innerHTML += cr_menu;
}

function generateLeaderboard() {
    var selected = getSelectedSet();
    selected_set = selected[0];
    selected_set_names = selected[1];
    var selected_err = getSelectedErr();
    var locality_val = getLocalityVal();

    //document.getElementById('range_value').innerHTML = locality_val + '%';

    // create table entries for all defenses
    var table = "";
    var score = [];
    var defs = [];
    var seen_percs = [];
    cr_single_per_def = {};
    cr_in_out_per_def = {};
    isopen_def = {};

    // compute scores and rankings
    for (let defense in defense_data) {
        defs.push(defense);
        const def_entry = defense_data[defense];
        const cr = selected_err(selected_set, def_entry['Accuracies'], def_entry['Details']['Attacks Used']);
        cr_single_per_def[defense] = cr[1];
        cr_in_out_per_def[defense] = [cr[2], cr[3]];
        isopen_def[defense] = false;
        const seen_perc = computePercentSeen(def_entry['Details']['Attacks Used'], selected_set);
        seen_percs.push(seen_perc);
        const sc = SC(selected_set, def_entry['Accuracies'], def_entry['Details']['Attacks Used'], locality_val, seen_perc);
        score.push([cr[0], sc]);

    }
    //console.log(cr_in_out_per_def);
    const rankings = argsort_ranking(score);
    //console.log('avg');
    //console.log(JSON.stringify(attack_hist_avg));
    //console.log('worst');
    //console.log(JSON.stringify(attack_hist_worst));
    //console.log(score)
    //console.log(rankings)

    // fill in table
    for (var i = 0 ; i < defs.length; i++){
        const defense = defs[i];
        //console.log(defense);
        const def_entry = defense_data[defense];
        table += `<tr data-child-value="${defense}" id="${defense}_row">`;
        table += `<td class="details-control"></td>`;
        table += `<td id="${defense}_rank">${rankings.indexOf(i) + 1}</td>`;
        table += `<td id="${defense}_name"><a href="${def_entry['Details']['Paper URL']}">${def_entry['Details']['Title']}</a><br>${def_entry['Details']['Comments']}</td>`;
        table += `<td id="${defense}_cleanacc">${dispNum(def_entry['Accuracies']['NoAttack'])}</td>`;
        const cr = score[i][0];
        const sc = score[i][1];
        table += `<td id="${defense}_cr">${cr}</td>`;
        table += `<td id="${defense}_sc">${sc}</td>`;
        table += `<td id="${defense}_seen">${seen_percs[i]}</td>`;
        table += `<td id="${defense}_tc">${def_entry['Details']['Train Complexity']}</td>`;
        table += `<td id="${defense}_exdat">${dispTF(def_entry['Details']['Extra Data'])}</td>`;
        table += `<td id="${defense}_arch">${def_entry['Details']['Architecture']}</td>`;
        table += `<td id="${defense}_select"><input type="checkbox" id="${defense}_checkbox" name="${defense}_checkbox"></select>`;
        table += "</tr>";
    }


    document.getElementById('leaderboard_body').innerHTML = table;
    leaderboard = $('#leaderboard').DataTable(
        {
            pageLength: 25,
            order: [[1, 'asc']],
            "columnDefs": [
              {"className": "dt-center", "targets": "_all"},
              {"targets": 0, "orderable": false, "searchable": false},
              {"targets": 5, "type": "mixed"}
            ]
        }
    );

    $('#leaderboard').on('click', 'td.details-control', function () {
        var tr = $(this).closest('tr');
        var row = leaderboard.row(tr);

        var defense_name = tr.data('child-value');
        if (row.child.isShown()) {
            // This row is already open - close it
            row.child.hide();
            //console.log(defense_name);
            isopen_def[defense_name] = false;
            delete open_charts[defense_name];
            //console.log(open_charts);
            tr.removeClass('shown');
        } else {
            // Open this row
            //console.log(row.child);
            isopen_def[defense_name] = true;
            row.child(generateGraphHTML(defense_name, Object.keys(attacks))).show();
            generateSingleCRPlots(defense_name, [defense_name], selected_set_names, cr_single_per_def, color_palette.slice(1));
            generateCRInOutPlots(defense_name, [defense_name], color_palette.slice(1));
            generateSingleSCPlots(defense_name, [defense_name], color_palette);
            generateMultiSCPlots(defense_name, [defense_name], selected_set, color_palette);
            //console.log(row.child);
            tr.addClass('shown');
        }
    });

    // generate hidden graph templates for comparison
    document.getElementById('comparison_attack_select').innerHTML = generateCompSCSelect("selected", Object.keys(attacks));
    const placeholder = Object.keys(defense_data)[0];
    generateSingleCRPlots('selected', [placeholder], selected_set_names, cr_single_per_def, color_palette.slice(1));
    generateCRInOutPlots('selected', [placeholder], color_palette.slice(1));
    generateSingleSCPlots('selected', [placeholder], color_palette);
    generateMultiSCPlots('selected', [placeholder], selected_set, color_palette);

}

/*
function update_val_display() {
    const locality_val = getLocalityVal();
    document.getElementById('range_value').innerHTML = locality_val + '%';
}
*/

function refreshLeaderboard() {
    const selected = getSelectedSet();
    selected_set = selected[0];
    selected_set_names = selected[1];
    if (selected_set.length === 0){
        alert('Please select at least 1 attack type to evaluate with');
        return;
    }
    const selected_err = getSelectedErr();
    const locality_val = getLocalityVal();
    cr_single_per_def = {};

    if (update_ranking) {
        update_ranking = false;
        var score = [];
        var defs = [];
        var seen_percs = [];

        // compute scores and rankings
        for (let defense in defense_data) {
            defs.push(defense);
            const def_entry = defense_data[defense];
            const cr = selected_err(selected_set, def_entry['Accuracies'], def_entry['Details']['Attacks Used']);
            cr_single_per_def[defense] = cr[1];
            cr_in_out_per_def[defense] = [cr[2], cr[3]];
            const seen_perc = computePercentSeen(def_entry['Details']['Attacks Used'], selected_set);
            const sc = SC(selected_set, def_entry['Accuracies'], def_entry['Details']['Attacks Used'], locality_val, seen_perc);
            score.push([cr[0], sc]);
            seen_percs.push(seen_perc);

        }
        const rankings = argsort_ranking(score);

        // update metrics
        for (var i = 0 ; i < defs.length; i++){
            const defense = defs[i];
            let row = leaderboard.row(`#${defense}_row`);
            let row_data = row.data();
            row_data[1] = rankings.indexOf(i) + 1;
            row_data[4] = score[i][0];
            row_data[5] = score[i][1];
            row_data[6] = seen_percs[i];

            row.data(row_data);
        }
    }
    else {
        for (let defense in defense_data){
            const def_entry = defense_data[defense];
            const cr = selected_err(selected_set, def_entry['Accuracies'], def_entry['Details']['Attacks Used']);
            cr_single_per_def[defense] = cr[1];
            cr_in_out_per_def[defense] = [cr[2], cr[3]];
            const seen_perc = computePercentSeen(def_entry['Details']['Attacks Used'], selected_set);
    
            let row = leaderboard.row(`#${defense}_row`);
            let row_data = row.data();
            row_data[4] = cr[0];
            row_data[5] = SC(selected_set, def_entry['Accuracies'], def_entry['Details']['Attacks Used'], locality_val, seen_perc);
            row_data[6] = seen_perc;
    
            row.data(row_data);
        }
    }
    leaderboard.draw();

    for (let defense in isopen_def){
        //console.log(defense);
        //console.log(isopen_def[defense]);
        if (isopen_def[defense]){
            updateCRPlot(defense, [defense], selected_set_names, cr_single_per_def);
            updateCRInOutPlot(defense, [defense], cr_in_out_per_def);
            updateMultiScPlot(defense, [defense], selected_set);
        }
    }
    if (comparison_open) {
        updateScPlot('selected', def2comp);
        updateCRPlot('selected', def2comp, selected_set_names, cr_single_per_def);
        updateCRInOutPlot('selected', def2comp, cr_in_out_per_def);
        updateMultiScPlot('selected', def2comp, selected_set);
    }
}

function generateComparison(){
    def2comp = [];
    comparison_open = true;
    for (let defense in defense_data){
        //console.log(defense);
        //console.log(document.getElementById(`${defense}_checkbox`));
        if (document.getElementById(`${defense}_checkbox`).checked) {
            def2comp.push(defense);
        }
    }

    if (def2comp.length < 2 || def2comp.length > 5) {
        alert('Please select between 2-5 defenses to compare');
        return;
    }

    //console.log(def2comp);

    updateScPlot('selected', def2comp);
    updateCRPlot('selected', def2comp, selected_set_names, cr_single_per_def);
    updateCRInOutPlot('selected', def2comp, cr_in_out_per_def);
    updateMultiScPlot('selected', def2comp, selected_set);

    document.getElementById("generate_compare").style = "display: none";
    document.getElementById("close_compare").style = "display: inline-block";
    document.getElementById("comparison_graphs").style = "display: inline-block; width: 100%";
}

function closeComparison(){
    comparison_open = false;
    document.getElementById("generate_compare").style = "display: inline-block";
    document.getElementById("close_compare").style = "display: none";
    document.getElementById("comparison_graphs").style = "display: none";
}
