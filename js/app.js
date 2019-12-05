//  Initialize Firebase
firebase.initializeApp({
    apiKey: "AIzaSyAWuZWgghzD0ap5b7FQeqOkQwjXZq1B8ik",
    authDomain: "charactersheet5e.firebaseapp.com",
    projectId: "charactersheet5e",
    messagingSenderId: "542586822557",
    appId: "1:542586822557:web:b7f1eb1e7e4a2e52315974",
    measurementId: "G-DG0PD1Z4X0"
});

//  Firebase Ref
const db = firebase.firestore();
const auth = firebase.auth();

//  Load Test Character and Parse

dbCharRef = db.collection("testUser").doc("testUID").collection("Characters").doc("TestCharacter")
dbCharRef.get().then((snapshot) => {
    currentCharacter = snapshot.data();
    populateSheet();
});

function populateSheet() {
    //Sheet Variables
    let characterLevelTotal = 0;
    const abilityModifiers = [];
    const abilityRef = ["Cha","Con","Dex","Int","Str","Wis","None"];
    let proficiencyModifier = 0;
    let passivePerception = 0;
    let initBonus = 0;
    const maxHitDice = [0,0,0,0];
    let attunedCount = 0;
    let memorizedCount = 0;


    //  Populate Sheet
        //  Populate Character Info
    $.each(currentCharacter.charInfo, function(key, value){
        if (key === "characterLevel") {
            const cInfo = currentCharacter.charInfo
            let classLevelText = ""
            $.each(cInfo[key], function(key2, value2){
                classLevelText += `${key2} ${cInfo[key][key2]['lvl']}, `;
                characterLevelTotal += cInfo[key][key2]['lvl'];
            });
            classLevelText = classLevelText.slice(0, -2);
            classLevelText+= ` [${characterLevelTotal}]`
            $(`#${key}`).text(classLevelText);
        } else {
        $(`#${key}`).text(value);
        }
    });
    $('#characterXP').val(currentCharacter.misc.xp);

        //  Polulate Ability Scores & Generate Ability Modifiers
    $.each(currentCharacter.abilityScores, function(key, value){
        $(`#${key}`).text(value);
        let abilityModNum = Math.floor((parseInt(value)-10)/2);
        let abilityModName = key.slice(0, -5) + "Mod"
        abilityModifiers.push(abilityModNum)
        if (abilityModNum > 0) {
            abilityModNum = "+" + abilityModNum
        }
        $(`#${key}`).text(value);
        $(`#${abilityModName}`).text(abilityModNum);
    });
    abilityModifiers.push(0)

        //  Generate Proficiency Bonus
    proficiencyModifier = Math.floor((characterLevelTotal - 1) / 4) + 2 + currentCharacter.misc.proficiencyBonus;
    $('#profBonus').text(`+${proficiencyModifier}`);

        //  Populate Saving Throws
    $.each(currentCharacter.savingThrows, function(key, value){$(`#${key}`).parent().children('img').remove()});
    $.each(currentCharacter.savingThrows, function(key, value){
        const cSave = currentCharacter.savingThrows
        const scoreLookup = cSave[key]['score'];
        const bonusLookup = cSave[key]['miscScore'];
        let profImg = ""
        let bonusAmount = 0;
        if (cSave[key]['prof'] === 1) {
            profImg = '<img class="profImg" src="img/Solid-Shield.png" alt="Proficient" title="Proficent"></img>'
        } else {
            profImg = '<img class="profImg" src="img/Hollow-Shield.png" alt="Non-Proficient" title="Non-Proficent">'
        }
        if (bonusLookup !== 6) {
            if (abilityModifiers[bonusLookup] > 0) {
                bonusAmount = abilityModifiers[bonusLookup];
            }
        }
        let saveBonus = proficiencyModifier * cSave[key]['prof'] + abilityModifiers[scoreLookup] + cSave[key]['misc'] + bonusAmount;
        $(`#${key}`).text(saveBonus);
        $(`#${key}`).parent().prepend(profImg);
    });

        //  Populate Skills & Passive Perception
    $('#skillsInfoList').empty();
    $.each(currentCharacter.skills, function(key, value){
        const cSkill = currentCharacter.skills
        const modRef = abilityRef[cSkill[key]['score']];
        let profImg = "";
        if (cSkill[key]['prof'] === 2) {
            profImg = '<img class="profImg" src="img/Blades-Solid-Shield.png" alt="Expertise" title="Expertise"></img>'
        } else if (cSkill[key]['prof'] === 1){
            profImg = '<img class="profImg" src="img/Solid-Shield.png" alt="Proficient" title="Proficient"></img>'
        } else if (cSkill[key]['prof'] === 0.5){
            profImg = '<img class="profImg" src="img/Blades-Hollow-Shield.png" alt="Half-Proficient" title="Half-Proficient"></img>'
        } else {
        profImg = '<img class="profImg" src="img/Hollow-Shield.png" alt="Non-Proficient" title="Non-Proficient">'
        }
        let skillBonus = Math.floor(proficiencyModifier * cSkill[key]['prof']) + abilityModifiers[cSkill[key]['score']] + cSkill[key]['misc'];
        if (key === "Perception") {
            passivePerception = 10 + skillBonus + abilityModifiers[currentCharacter.misc.passivePerceptionBonus['miscScore']] + currentCharacter.misc.passivePerceptionBonus['misc'];
        };

        skillString = `<span class="row skillItm">${profImg}<span class="skillTitle">${key} (${modRef})</span><div class="skillEntry infoInput" title="${key} Skill Bonus">${skillBonus}</div>`
        $('#skillsInfoList').append(skillString);
    });
    $('#passivePerception').text(passivePerception);

        //  Populate Badges
            //  Initiative Badge
    initBonus = abilityModifiers[2] + abilityModifiers[currentCharacter.misc.initiative['miscScore']] + currentCharacter.misc.initiative['misc'];
    if (initBonus > 0) {initBonus = "+" + initBonus};
    $('#initiativeBonus').text(initBonus);

            //  Armor Class Badge
    armor = function() {
        if (currentCharacter.misc.armorClass['maxDex'] > abilityModifiers[2]) {
            dexBon = abilityModifiers[2]} else {dexBon = currentCharacter.misc.armorClass['maxDex']};
        const armor = currentCharacter.misc.armorClass['armor'] + dexBon + currentCharacter.misc.armorClass['shield'] + currentCharacter.misc.armorClass['misc'] + abilityModifiers[currentCharacter.misc.armorClass['miscScore']];
        return armor
    }
    $('#armorClass').text(armor);

            //  HP Badge
    $('#hitPoints').text(currentCharacter.misc.hitPoints['currentHP'] + currentCharacter.misc.hitPoints['tempHP']);

            //  Hit Dice Badge
    currentHitDice = function() {
        let hdString = ""
        $.each(currentCharacter.misc.hitDice, function(key, value){
            if (key !== 'recover') {
                if (value > 0) {
                    hdString += `${value}${key}, `;
        }};
    });
        hdString = hdString.slice(0,-2);
        return hdString
    };
    $.each(currentCharacter.charInfo.characterLevel, function(key, value){
        maxHitDice[currentCharacter.charInfo.characterLevel[key]['hd']] += currentCharacter.charInfo.characterLevel[key]['lvl'];
    });
    $('#hitDice').text(currentHitDice);

            //  Speed & Vision Badge
    $('#speed').text(currentCharacter.misc.speed);
    $('#vision').text(currentCharacter.misc.vision);

        //  Populate Attacks
    $('#attackWrapper').children('span').not('span:first').remove();
    $.each(currentCharacter.attacks, function(key, value){
        const cAtk = currentCharacter.attacks
        const scoreLookup = cAtk[key]['score'];
        const atkBonus = cAtk[key]['prof'] * proficiencyModifier + abilityModifiers[scoreLookup] + cAtk[key]['atkBon'];
        const damage = `${cAtk[key]['damage']}+${abilityModifiers[scoreLookup] + cAtk[key]['dmgBon']}`;
        const attackSpan = `<span class="atkItem infoInput row growText"><div class="atkName textDefault">${key}</div><div class="atkBns textDefault">+${atkBonus}</div><div class="atkDmg textDefault">${damage}</div><div class="atkRng textDefault">${cAtk[key]['range']}</div></span>`
        $('#attackWrapper').append(attackSpan);
    });

        //  Populate Character Details
    $('#charInfoList').empty();
    $.each(currentCharacter.details, function(key, value){
        const detailArticle = `<article class="detailHeader"><span class="row"><img class="edit" src="img/Pencil-Grey.png" alt="Edit Entry" title="Edit Entry">${key}</span><div class="detailInfo growText">${value}</div></article>`
        $('#charInfoList').append(detailArticle);
    });

        //  Populate Inventory
    $('#inventory').empty();
    let equippedItems = "";
    let unequippedItems = "";
    $.each(currentCharacter.inventory, function(key, value){
        const cInv = currentCharacter.inventory;
        let attunement = "";
        let equipped = "";
        let listItem = "";
        if (cInv[key]['attune'] && cInv[key]['equipped']) {attunedCount+= 1};
        if (cInv[key]['attune']) {attunement = '<p title="Requires Attunement">A</p>'} else {attunement = '<p></p>'};
        if (cInv[key]['equipped']) {
            equipped = '<div class="isEquippedBtn equipped" title="Equip/Unequip Item"></div>';
            listItem = '<li class="row growText equippedList">'
        } else {
            equipped = '<div class="isEquippedBtn" title="Equip/Unequip Item"></div>'
            listItem = '<li class="row growText">'
        };
        const itemDetail = `${listItem}<p class="relQty">${cInv[key]['qty']}x</p><span>${key}</span>${attunement}${equipped}</li>`;
        if (cInv[key]['equipped']) {equippedItems += itemDetail} else {unequippedItems += itemDetail};
    });
    $('#inventory').append(equippedItems).append(unequippedItems);
    if (attunedCount > 0) {$('#inventory').parent().prepend(`<div class="attunement" title="Items Attuned">${attunedCount}</div>`)};

        //  Populate Coin
    $('#ppAmount').val(currentCharacter.misc.coin['pp']);
    $('#gpAmount').val(currentCharacter.misc.coin['gp']);
    $('#spAmount').val(currentCharacter.misc.coin['sp']);
    $('#cpAmount').val(currentCharacter.misc.coin['cp']);

        //  Populate Spell Attack & DC
    let spellAtk = proficiencyModifier + abilityModifiers[currentCharacter.spells.spellStats['score']] + currentCharacter.spells.spellStats['atkMod'];
    if (spellAtk > 0) {spellAtk = "+" + spellAtk}
    $('#spellAttack1').text(spellAtk);
    $('#spellDC1').text(8 + proficiencyModifier + abilityModifiers[currentCharacter.spells.spellStats['score']] + currentCharacter.spells.spellStats['dcMod'] )

        //  Populate Spells List
    $.each(currentCharacter.spells.spellsList, function(key, value){$(`#${key}`).empty();});
    $.each(currentCharacter.spells.spellsList, function(key, value){
        let memSpells = ""
        let unmemSpells = ""
        $.each(currentCharacter.spells.spellsList[key], function(key2, value2){
            cSpell = currentCharacter.spells.spellsList[key];
            let isRitual = "";
            let isConcentration = "";
            let isMemorized = "";
            if (cSpell[key2]['isRitual']) {isRitual = '<p title="Ritual Spell">R</p>'} else {isRitual = '<p></p>'};
            if (cSpell[key2]['isConc']) {isConcentration = '<p title="Requires Concentration">C</p>'} else {isConcentration = '<p></p>'};
            if (cSpell[key2]['isMem']) {
                isMemorized = '<article>';
                if (key !== "spellCantrip") {memorizedCount += 1;}
            } else {isMemorized = '<article class="notMemorized">'};
            let spellInfo = `<li>${isMemorized}${key2}</article>${isRitual}${isConcentration}<img class="trash" src="img/trash.png" alt="Remove Spell" title="Remove Spell"></li>`;
            if (cSpell[key2]['isMem']) {memSpells += spellInfo} else {unmemSpells += spellInfo};
        });
        $(`#${key}`).append(memSpells).append(unmemSpells);
    });
    $('#spellMemorized').text(memorizedCount);

        //  Populate Spells Slots
    $.each(currentCharacter.spells.spellCasts, function(key, value){
        cCasts = currentCharacter.spells.spellCasts
        $(`#${key}`).text(`${cCasts[key]['remain']} / ${cCasts[key]['total']}`);
        if (cCasts[key]['total'] === 0) {$(`#${key}`).parent().parent().hide()};
    });
}

function sortObjKeysAlphabetically(obj) {
    const ordered = {};
    Object.keys(obj).sort().forEach(function(key) {
        ordered[key] = obj[key];
    });
    return ordered;
  }

  function checkSize(){
    if ($('.burgerMenu').css("display") == "none" ) {
        $('#topMenu').css("display","flex")
    } else {
        $('#topMenu').css("display","none")
    }

}


$(document).ready(function() {
    checkSize();
    $(window).resize(checkSize());
});






  //  Menu Burger
  $('header').on('click', '.burgerMenu', function(){
    $('#topMenu').toggle();
});

//  Menu Bar
$('header').on('mouseover', 'h3', function(){
    $(this).children().show();
});
$('header').on('mouseleave', 'h3', function(){
    $(this).children().hide();
});

//  Update XP Total
$('#charExperience input[type="submit"]').on('click', function(e){
    e.preventDefault();
    const xpTotal = $('#characterXP').val();
    currentCharacter.misc.xp = xpTotal;
    $('#characterXP').blur();
    const update = {}
    update['misc.xp'] = currentCharacter.misc.xp;
    dbCharRef.update(update);
    populateSheet();
});
$('#characterXP').on('focusout', function(){
    const xpTotal = $('#characterXP').val();
    currentCharacter.misc.xp = xpTotal;
    const update = {}
    update['misc.xp'] = currentCharacter.misc.xp;
    dbCharRef.update(update);
    populateSheet();
});

//Inventory Management
    //  Add Item to Inventory
$('#addItemForm input[type="submit"]').on('click', function(e){
    e.preventDefault();
    const itemName = $('#addItemName').val();
    let itemAmt = parseInt($('#addItemAmount').val());
    const itemAtune = $('#addItemAttunement').prop('checked');
    if (currentCharacter.inventory.hasOwnProperty(itemName)) {
        alert("Item already on list!");
    } else {
        if (itemName !== "" && itemAmt !== 0) {
            if (isNaN(itemAmt) || itemAmt === "" || itemAmt === null) {itemAmt = 1};
            $('#addItemAmount').val(null);
            $('#addItemName').val(null);
            $('#addItemAttunement').prop('checked', false);
            currentCharacter.inventory[itemName] = {'qty':itemAmt,'attune':itemAtune,'equipped':false};
            const update = {};
            update['inventory'] = currentCharacter.inventory;
            dbCharRef.set(update,{merge:true});
            populateSheet();
        };
    };
});


    //  Change Quantity - Insert Qty Changer Element
$('#inventory').on('click', '.relQty', function(){
    const itemName = $(this).parent().children('span').text();
    const itemQty = currentCharacter.inventory[itemName]['qty'];
    const qtyForm = `<form class="sectWrapper" id="qtyForm"><h3>${itemName}</h3><input type="number" id="newQty" class=""><input type="image" class="checkmark" name="submit" src="img/checkmark.png" alt="Submit" title="Submit"><img class="cancel" src="img/xmark.png" alt="Cancel" title="Cancel"><img class="trash" src="img/trash.png" alt="Remove Item" title="Remove Item"></form>`
    $(this).parent().append(qtyForm);
    $(this).parent().children('#qtyForm').children('#newQty').val(itemQty);
    $(this).parent().children('#qtyForm').focus();
});

    //  Change Quantity - Remove Item
$('#inventory').on('click', '.trash', function(){
    const itemName = $(this).parent().parent().children('span').text();
    console.log(itemName);
    $('#qtyForm').remove()
    delete currentCharacter.inventory[itemName];
    const remove = {};
    remove['inventory.'+itemName] = firebase.firestore.FieldValue.delete();
    dbCharRef.update(remove);
    populateSheet();
});

    //  Change Quantity - Cancel
$('#inventory').on('click', '.cancel', function(){
    $('#qtyForm').remove()
});

//  Change Quantity - Remove Qty Changer Element on Focus Out
$(document).mouseup(function(e){
    if (!$('#qtyForm').is(e.target) && $('#qtyForm').has(e.target).length === 0) {
        $('#qtyForm').remove();
    }
});

    //  Change Quantity - Modify Amount
$('#inventory').on('click', 'input[type="image"]', function(e){
    e.preventDefault();
    const itemName = $(this).parent().parent().children('span').text();
    const currentQty = currentCharacter.inventory[itemName]['qty'];
    let newQty = parseInt($(this).parent().children('input[type="number"]').val());
    const update = {};
    console.log(itemName+" "+currentQty+" "+newQty);
    if (isNaN(newQty) || newQty === "" || newQty === null) {newQty = currentQty};
    if (newQty === 0) {
        delete currentCharacter.inventory[itemName];
        update['inventory.'+itemName] = firebase.firestore.FieldValue.delete();
        dbCharRef.update(update);
        populateSheet();
    }
    if (newQty !== currentQty && newQty !== 0) {
        currentCharacter.inventory[itemName]['qty'] = newQty;
        update['inventory.'+itemName+'.qty'] = newQty;
        dbCharRef.update(update);
        populateSheet();
    }
    console.log(update);
    $('#qtyForm').remove();
});


    //  Toggle Equipped
$('#inventory').on('click','div', function(){
    const itemName = $(this).parent().children('span').text();
    let toggle = true;
    if(currentCharacter.inventory[itemName]['equipped'] === true) {
        currentCharacter.inventory[itemName]['equipped'] = false;
        toggle = false;
    } else {
        currentCharacter.inventory[itemName]['equipped'] = true;
    };
    const update = {}
    update['inventory.'+itemName+'.equipped'] = toggle
    dbCharRef.update(update);
    populateSheet();
});


//  Update Currency
$('#money input[type="submit"]').on('click', function(e){
    e.preventDefault();
    const prevPP = currentCharacter.misc.coin.pp;
    const prevGP = currentCharacter.misc.coin.gp;
    const prevSP = currentCharacter.misc.coin.sp;
    const prevCP = currentCharacter.misc.coin.cp;
    const ppAmount = parseInt($('#ppAmount').val());
    const gpAmount = parseInt($('#gpAmount').val());
    const spAmount = parseInt($('#spAmount').val());
    const cpAmount = parseInt($('#cpAmount').val());
    if (isNaN(ppAmount) || isNaN(gpAmount) || isNaN(spAmount) || isNaN(cpAmount)) {
        alert('Not a number.  Try Again')
    } else if (prevPP !== ppAmount || prevGP !== gpAmount || prevSP !== spAmount || prevCP !== cpAmount)  {
        currentCharacter.misc.coin.pp = ppAmount;
        currentCharacter.misc.coin.gp = gpAmount;
        currentCharacter.misc.coin.sp = spAmount;
        currentCharacter.misc.coin.cp = cpAmount;
        $('#money input[type="text"]').blur();
        const update = {};
        update['misc.coin'] = {'pp':ppAmount,'gp':gpAmount,'sp':spAmount,'cp':cpAmount};
        dbCharRef.update(update);
        populateSheet();
    }
});
$('#money input[type="text"]').on('focusout', function(){
    const prevPP = currentCharacter.misc.coin.pp;
    const prevGP = currentCharacter.misc.coin.gp;
    const prevSP = currentCharacter.misc.coin.sp;
    const prevCP = currentCharacter.misc.coin.cp;
    const ppAmount = $('#ppAmount').val();
    const gpAmount = $('#gpAmount').val();
    const spAmount = $('#spAmount').val();
    const cpAmount = $('#cpAmount').val();
    if (isNaN(ppAmount) || isNaN(gpAmount) || isNaN(spAmount) || isNaN(cpAmount)) {
        alert('Not a number.  Try Again')
    } else if (prevPP !== ppAmount || prevGP !== gpAmount || prevSP !== spAmount || prevCP !== cpAmount) {
        currentCharacter.misc.coin.pp = ppAmount;
        currentCharacter.misc.coin.gp = gpAmount;
        currentCharacter.misc.coin.sp = spAmount;
        currentCharacter.misc.coin.cp = cpAmount;
        const update = {};
        update['misc.coin'] = {'pp':ppAmount,'gp':gpAmount,'sp':spAmount,'cp':cpAmount};
        dbCharRef.update(update);
        populateSheet();
    }
});

//Spell Management
    //  Add Spell to List
$('#addSpellForm input[type="submit"]').on('click', function(e){
    e.preventDefault();
    const spellName = $('#addSpellName').val();
    const spellLvl = $('#addSpellLevel').val();
    const spellRitual = $('#addSpellRitual').prop('checked');
    const spellConcentration = $('#addSpellConcentration').prop('checked');
    let spellMem = false;
    if (spellLvl === "spellCantrip") {spellMem = true}
    if (spellName !== "") {
        $('#addSpellName').val(null);
        $('#addSpellRitual').prop('checked', false);
        $('#addSpellConcentration').prop('checked', false);
        currentCharacter.spells.spellsList[spellLvl][spellName] = {'isRitual':spellRitual,'isConc':spellConcentration,'isMem':spellMem}
        currentCharacter.spells.spellsList[spellLvl] = sortObjKeysAlphabetically(currentCharacter.spells.spellsList[spellLvl]);
        const update = {}
        update['spells.spellsList.'+spellLvl+'.'+spellName] = {'isRitual':spellRitual,'isConc':spellConcentration,'isMem':spellMem}
        dbCharRef.update(update);
        populateSheet();
    }
});

    //  Remove Spell from List
$('#spellList').on('click', '.trash', function(){
    const spellName = $(this).parent().children('article:first').text();
    const spellLvl = $(this).parent().parent().attr('id');
    delete currentCharacter.spells.spellsList[spellLvl][spellName]
    const remove = {};
    remove['spells.spellsList.'+spellLvl+'.'+spellName] = firebase.firestore.FieldValue.delete();
    dbCharRef.update(remove);
    populateSheet();
});

    //  Toggle Memorization
$('#spellList').on('click','article', function(){
    const spellName = $(this).text();
    const spellLvl = $(this).parent().parent().attr('id');
    let toggle = true
    if(currentCharacter.spells.spellsList[spellLvl][spellName]['isMem'] === true) {
        currentCharacter.spells.spellsList[spellLvl][spellName]['isMem'] = false;
        toggle = false;
    } else {
        currentCharacter.spells.spellsList[spellLvl][spellName]['isMem'] = true;
    };
    const update = {}
    update['spells.spellsList.'+spellLvl+'.'+spellName+'.isMem'] = toggle
    dbCharRef.update(update);
    populateSheet();
});