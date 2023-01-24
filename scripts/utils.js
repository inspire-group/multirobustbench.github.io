var attacks = {
    'AutoL1Attack': 'L1',
    'AutoLinfAttack': 'Linf',
    'AutoL2Attack': 'L2',

    'ElasticAttack': 'Elastic',
    'JPEGL1Attack': 'L1 JPEG',
    'JPEGLinfAttack': 'Linf JPEG',
    'FogAttack': 'Fog',
    'GaborAttack': 'Gabor',
    'SnowAttack': 'Snow',
    
    'ReColorAdvAttack': 'ReColor',
    'Hue': 'Hue',
    'Saturation': 'Saturation',
    'Brightness': 'Brightness',
    'Contrast': 'Contrast',

    'StAdvAttack': 'StAdv',
    'AffineWarp': 'Affine Warp',
    'PerspectiveWarp': 'Perspective Warp',

    'LPIPSAttack': 'LPIPS'
    //'WassersteinAttack': 'Wasserstein'
};

const attacks_outside_ranking = ['FogAttack', 'GaborAttack', 'SnowAttack',
'Hue', 'Saturation', 'Brightness', 'Contrast', 'AffineWarp', 'PerspectiveWarp']

var attack_grouping = {
    'Lp Attacks': ['AutoL1Attack',
    'AutoLinfAttack',
    'AutoL2Attack'],
    'UAR Attacks': ['ElasticAttack',
    'JPEGL1Attack',
    'JPEGLinfAttack',
    'FogAttack',
    'GaborAttack',
    'SnowAttack'],
    
    'Color Changes': [
    'ReColorAdvAttack',
    'Hue',
    'Saturation',
    'Brightness',
    'Contrast'],

    'Spatial Transformations': [
    'StAdvAttack',
    'AffineWarp',
    'PerspectiveWarp'],

    'Other': ['LPIPSAttack']
};

var CR_settings = {
    "Average": {"Individual": CR_ind_avg, "Aggregated": CR_exp},
    "Worst case":{"Individual": CR_ind_worst, "Aggregated": CR_max}
}

var update_ranking = false;

const color_palette = ['0,0,0', '4,170,109', '229, 61, 0', '104, 131, 186', '135, 214, 141', '4, 114, 77', '239, 45, 86'];

function switchLeaderboard() {
    update_ranking = !update_ranking;
}

function sortby(a, b){
    //console.log(a);
    //console.log(b);
    const cr_a = parseFloat(a[0][0]);
    const cr_b = parseFloat(b[0][0]);
    //console.log(a[0][0] + " " + b[0][0]);
    //console.log(cr_b - cr_a);
    if (cr_a - cr_b != 0) {
        return  cr_b - cr_a;
    }
    else {
        if ((a[0][1] === '-') && (b[0][1] !== '-')){
            return 1;
        }
        else if ((a[0][1] !== '-') && (b[0][1] === '-')){
            return -1;
        }
        else if ((a[0][1] === '-') && (b[0][1] === '-')){
            return 0;
        }
        return parseFloat(a[0][1]) - parseFloat(b[0][1]);
    }
}

let decor = (v, i) => [v, i];          // set index to value
let undecor = a => a[1];               // leave only index
let argsort_ranking = arr => arr.map(decor).sort(sortby).map(undecor);
let argsort = arr => arr.map(decor).sort(function(a, b){return parseFloat(a)-parseFloat(b)}).map(undecor);

function CR_exp(selected_set, def_accs, seen){
    //console.log('computing CR');
    const seen_set = Object.keys(seen);
    var numerator = def_accs['NoAttack'];
    var denominator = ata_accs['NoAttack'];

    var numerator_in = def_accs['NoAttack'];
    var denominator_in = ata_accs['NoAttack'];

    var numerator_out = 0;
    var denominator_out = 0;

    var CR_single = [];
    for (const attack of selected_set) {
        //console.log(attack);
        var num_single = def_accs['NoAttack'];
        var denom_single = ata_accs['NoAttack'];
        for (let eps in def_accs[attack]) {
            numerator += def_accs[attack][eps];
            denominator += ata_accs[attack][eps];
            num_single += def_accs[attack][eps];
            denom_single += ata_accs[attack][eps];
            if (seen_set.includes(attack) && parseFloat(eps) <= seen[attack]) {
                numerator_in += def_accs[attack][eps];
                denominator_in += ata_accs[attack][eps];
            }
            else {
                numerator_out += def_accs[attack][eps];
                denominator_out += ata_accs[attack][eps];
            }

        }
        CR_single.push(num_single / denom_single * 100);
    }
    var cr_out;
    if (denominator_out = 0) {
        cr_out = 0;
    }
    else {
        cr_out = numerator_out / denominator_out;
    }
    //console.log(numerator);
    //console.log(denominator);
    return [dispNum(numerator / denominator * 100), CR_single, 
    numerator_in / denominator_in * 100, cr_out * 100];
}

function CR_max(selected_set, def_accs, seen){
    var numerator = def_accs['NoAttack'];
    var denominator = ata_accs['NoAttack'];
    const seen_set = Object.keys(seen);
    var numerator_in = def_accs['NoAttack'];
    var denominator_in = ata_accs['NoAttack'];

    var numerator_out = 1;
    var denominator_out = 1;

    var CR_single = [];
    for (const attack of selected_set) {
        var num_single = def_accs['NoAttack'];
        var denom_single = ata_accs['NoAttack'];
        for (let eps in def_accs[attack]) {
            numerator = Math.min(numerator, def_accs[attack][eps]);
            denominator = Math.min(denominator, ata_accs[attack][eps]);
            num_single = Math.min(num_single, def_accs[attack][eps]);
            denom_single = Math.min(denom_single, ata_accs[attack][eps]);

            if (seen_set.includes(attack) && parseFloat(eps) <= seen[attack]) {
                numerator_in =  Math.min(numerator_in, def_accs[attack][eps]);
                denominator_in = Math.min(denominator_in, ata_accs[attack][eps]);
            }
            else {
                numerator_out =  Math.min(numerator_out, def_accs[attack][eps]);
                denominator_out = Math.min(denominator_out, ata_accs[attack][eps]);
            }
        }
        CR_single.push(num_single / denom_single * 100);
    }
    return [dispNum(numerator / denominator * 100), CR_single, 
    numerator_in / denominator_in * 100, numerator_out / denominator_out * 100];
}

function CR_ind_avg(selected_set, def_accs, seen){
    var frac = def_accs['NoAttack'] / ata_accs['NoAttack'];
    var frac_in = def_accs['NoAttack'] / ata_accs['NoAttack'];
    const seen_set = Object.keys(seen);
    var num_in = 1;
    var num_out = 0;
    var frac_out = 0;
    var num_attacks = 1;
    var CR_single = [];
    for (const attack of selected_set) {
        var frac_single = def_accs['NoAttack'] / ata_accs['NoAttack'];
        var num_attacks_single = 1;
        for (let eps in def_accs[attack]) {
            const val = def_accs[attack][eps] / ata_accs[attack][eps];
            frac += val;
            frac_single += val;
            if (seen_set.includes(attack) && parseFloat(eps) <= seen[attack]) {
                frac_in += val;
                num_in++;
            }
            else {
                frac_out += val;
                num_out++;
            }
            num_attacks++;
            num_attacks_single++;
        }
        //if (!Object.keys(attack_hist_avg).includes(attack)){
        //    attack_hist_avg[attack] = [];
        //}
        //attack_hist_avg[attack].push(frac_single / num_attacks_single * 100);
        CR_single.push(frac_single / num_attacks_single * 100);
    }
    var cr_out;
    if (num_out === 0) {
        cr_out = 0;
    }
    else {
        cr_out = frac_out / num_out;
    }
    return [dispNum(frac / num_attacks * 100), CR_single, frac_in / num_in * 100, cr_out * 100];
}

function CR_ind_worst(selected_set, def_accs, seen){
    var frac = def_accs['NoAttack'] / ata_accs['NoAttack'];
    const seen_set = Object.keys(seen);
    var frac_in = def_accs['NoAttack'] / ata_accs['NoAttack'];
    var frac_out = 1;
    var CR_single = [];
    for (const attack of selected_set) {
        var frac_single = def_accs['NoAttack'] / ata_accs['NoAttack'];
        for (let eps in def_accs[attack]) {
            const val = def_accs[attack][eps] / ata_accs[attack][eps];
            frac = Math.min(frac, val);
            frac_single = Math.min(frac_single, val);
            if (seen_set.includes(attack) && parseFloat(eps) <= seen[attack]) {
                frac_in =  Math.min(frac_in, val);
            }
            else {
                frac_out = Math.min(frac_out, val);
            }
        }
       ;// if (!Object.keys(attack_hist_worst).includes(attack)){
        //    attack_hist_worst[attack] = [];
        //}
        //attack_hist_worst[attack].push(frac_single * 100);
        CR_single.push(frac_single * 100);
    }
    //console.log(CR_single);
    return [dispNum(frac * 100), CR_single, frac_in * 100, frac_out * 100];
}

function SC(selected_set, def_accs, seen, locality_val, seen_perc) {
    if (seen_perc == 100) {
        return '-';
    }
    var alpha = locality_val;
    var max_frac = 0;
    // NoAttack always considered seen
    for (const p2 of selected_set) {
        for (let eps2 in def_accs[p2]){
            var s_ata = Math.abs(ata_accs['NoAttack'] - ata_accs[p2][eps2]);
            if (s_ata < alpha) {
                var frac = Math.abs(def_accs['NoAttack'] - def_accs[p2][eps2]) / s_ata;
                max_frac = Math.max(max_frac, frac);
            }
        }
    }


    // Consider all other seen attacks
    for (let p1 in seen){
        //console.log(p1);
        if (!(Object.keys(ata_accs).includes(p1))) {continue;}
        //var all_eps_p1 = Object.keys(def_accs[p1]);
        // compare to other attack types that are close
        for (let eps in def_accs[p1]) {
            //var eps = all_eps_p1[idx];
            //console.log(eps);
            if (parseFloat(eps) <= seen[p1]) {
                for (const p2 of selected_set) {

                    for (let eps2 in def_accs[p2]){
                        if (p2 !== p1 || eps2 !== eps) { // check that attacks aren't the same
                            var s_ata = Math.abs(ata_accs[p1][eps] - ata_accs[p2][eps2]);
                            if (s_ata == 0) {
                                //console.log(p1 + ', ' +eps);
                                //console.log(p2 + ', ' + eps2);
                            }
                            if (s_ata < alpha && s_ata > 0) {
                                var frac = Math.abs(def_accs[p1][eps] - def_accs[p2][eps2]) / s_ata;
                                max_frac = Math.max(max_frac, frac);
                            }
                        }
                    }
                }
            }
            else break;
        }
    }
    
    return dispNum(max_frac);
}

function getSelectedSet() {
    var selected_set = [];
    var selected_set_names = [];
    for (let attack in attacks) {
        if (document.getElementById(`${attack}_checkbox`).checked) {
            selected_set.push(attack);
            selected_set_names.push(attacks[attack]);
        }
    }
    return [selected_set, selected_set_names];
}

function getSelectedErr() {
    var selected_err;
    for (let leaderboard_type in CR_settings) {
        //for (let setting in CR_settings[leaderboard_type]) {
            //if (document.getElementById(`${leaderboard_type}_checkbox`).checked && document.getElementById(`${setting}_checkbox`).checked) {
            if (document.getElementById(`${leaderboard_type}_checkbox`).checked) {
                selected_err = CR_settings[leaderboard_type]["Individual"];
                break;
            }
        //}
    }
    return selected_err;
}

function getLocalityVal() {
    //return document.getElementById('alpha_range').value;
    return 3;
}

function dispNum(num) {
    var float = parseFloat(num);
    return float.toFixed(2);
}

function dispTF(bool) {
    if (bool) {
        // display checkmark
        return '&#9745;';
    }
    else {
        return '&#10005;';
    }
}

function computePercentSeen(seen_data, selected_set){
    var seen_atks = Object.keys(seen_data);
    var total_atks = 1; // counting NoAttack
    var seen_count = 1; // NoAttack is always seen
    //console.log(seen_atks);
    for (const attack of selected_set) {
        total_atks += Object.keys(ata_accs[attack]).length;
        if (seen_atks.includes(attack)) {
            //console.log(attack);
            var seen = parseFloat(seen_data[attack]);
            for (let eps_str in ata_accs[attack]) {
                var eps = parseFloat(eps_str);
                if (eps <= seen) {
                    seen_count++;
                }
                //else{
                //    console.log(seen);
                //    console.log(eps);
                //}
            }
        }
    }
    return dispNum(seen_count / total_atks * 100);
}

$.fn.dataTableExt.oSort["mixed-asc"] = function (a, b)
    {
        if ((a === '-') && (b !== '-')){
            return 1;
        }
        else if ((a !== '-') && (b === '-')){
            return -1;
        }
        else if ((a === '-') && (b === '-')){
            return 0;
        }
        return parseFloat(a) - parseFloat(b);
    };

$.fn.dataTableExt.oSort["mixed-desc"] = function (a, b)
{
    if ((a === '-') && (b !== '-')){
        return 1;
    }
    else if ((a !== '-') && (b === '-')){
        return -1;
    }
    else if ((a === '-') && (b === '-')){
        return 0;
    }
    return parseFloat(b) - parseFloat(a);
};