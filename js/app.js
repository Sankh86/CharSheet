
//Load Test Character and Parse
const request = new XMLHttpRequest();
request.open("GET", "../TestChar.json", false);
request.send(null)
const currentCharacter = JSON.parse(request.responseText);


function populateSheet() {
    //Populate Sheet
        //Populate Character Info
    let characterLevelTotal = 0
    $.each(currentCharacter.charInfo, function(key, value){
        if (key === "characterLevel") {
            let classLevelText = ""
            $(value).each(function(key2, classDetails){
                classLevelText += `${classDetails[0]} ${classDetails[1]}, `;
                characterLevelTotal += classDetails[1];
            });
            classLevelText = classLevelText.slice(0, -2);
            classLevelText+= ` [${characterLevelTotal}]`
            $(`#${key}`).text(classLevelText);
        } else {
        $(`#${key}`).text(value);
        }
    });
    $('#characterXP').val(currentCharacter.misc.xp);

        //Polulate Ability Scores & Generate Ability Modifiers
    const abilityModifiers = []
    const abilityRef = ["Str","Dex","Con","Int","Wis","Cha","None"]
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

        //Generate Proficiency Bonus
    const proficiencyModifier = Math.floor((characterLevelTotal - 1) / 4) + 2 + currentCharacter.misc.proficiencyBonus;
    $('#profBonus').text(`+${proficiencyModifier}`);

        //Populate Saving Throws
    $.each(currentCharacter.savingThrows, function(key, value){
        const scoreLookup = value[1];
        const bonusLookup = value[3];
        let profImg = ""
        let bonusAmount = 0;
        if (value[0] === 1) {
            profImg = '<img class="profImg" src="img/Solid-Shield.png" alt="Proficient" title="Proficent"></img>'
        } else {
            profImg = '<img class="profImg" src="img/Hollow-Shield.png" alt="Non-Proficient" title="Non-Proficent">'
        }
        if (bonusLookup !== 6) {
            if (abilityModifiers[bonusLookup] > 0) {
                bonusAmount = abilityModifiers[bonusLookup];
            }
        }
        let saveBonus = proficiencyModifier * value[0] + abilityModifiers[scoreLookup] + value[2] + bonusAmount;
        $(`#${key}`).text(saveBonus);
        $(`#${key}`).parent().prepend(profImg);
    });

        //Populate Skills & Passive Perception
    let passivePerception = 0
    $.each(currentCharacter.skills, function(key, value){
        const modRef = abilityRef[value[2]];
        let profImg = "";
        if (value[1] === 2) {
            profImg = '<img class="profImg" src="img/Blades-Solid-Shield.png" alt="Expertise" title="Expertise"></img>'
        } else if (value[1] === 1){
            profImg = '<img class="profImg" src="img/Solid-Shield.png" alt="Proficient" title="Proficient"></img>'
        } else if (value[1] === 0.5){
            profImg = '<img class="profImg" src="img/Blades-Hollow-Shield.png" alt="Half-Proficient" title="Half-Proficient"></img>'
        } else {
        profImg = '<img class="profImg" src="img/Hollow-Shield.png" alt="Non-Proficient" title="Non-Proficient">'
        }
        let skillBonus = Math.floor(proficiencyModifier * value[1]) + abilityModifiers[value[2]] + value[3];
        if (value[0] === "Perception") {
            passivePerception = 10 + skillBonus + abilityModifiers[currentCharacter.misc.passivePerceptionBonus[0]] + currentCharacter.misc.passivePerceptionBonus[1];
        };

        skillString = `<span class="row skillItm">${profImg}<span class="skillTitle">${value[0]} (${modRef})</span><div class="skillEntry infoInput" title="${value[0]} Skill Bonus">${skillBonus}</div>`
        $('#skillsInfoList').append(skillString);
    });
    $('#passivePerception').text(passivePerception);

        //Populate Badges
            //Initiative Badge
    let initBonus = abilityModifiers[1] + abilityModifiers[currentCharacter.misc.initiative[0]] + currentCharacter.misc.initiative[1];
    if (initBonus > 0) {initBonus = "+" + initBonus};
    $('#initiativeBonus').text(initBonus);

            //Armor Class Badge
    armor = function() {
        if (currentCharacter.misc.armorClass[1] > abilityModifiers[1]) {
            dexBon = abilityModifiers[1]} else {dexBon = currentCharacter.misc.armorClass[1]};
        const armor = currentCharacter.misc.armorClass[0] + dexBon + currentCharacter.misc.armorClass[2] + currentCharacter.misc.armorClass[3] + abilityModifiers[currentCharacter.misc.armorClass[4]];
        return armor
    }
    $('#armorClass').text(armor);

            //HP Badge
    $('#hitPoints').text(currentCharacter.misc.hitPoints[1] + currentCharacter.misc.hitPoints[2] + currentCharacter.misc.hitPoints[3]);

            //Hit Dice Badge
    currentHitDice = function() {
        let hdString = ""
        $.each(currentCharacter.misc.hitDice, function(key, value){
            if (key !== 4) {
                if (value > 0) {
                    hdString += value;
                    if (key === 0) {hdString+="d6, "} else if (key === 1) {hdString+="d8, "} else if (key === 2) {hdString+="d10, "} else {hdString+="d12, "};
        }};
    });
        hdString = hdString.slice(0,-2);
        return hdString
    };
    const maxHitDice = [0,0,0,0]
    $.each(currentCharacter.charInfo.characterLevel, function(key, value){
        maxHitDice[value[2]] += value[1];
    });
    $('#hitDice').text(currentHitDice);

            //Speed & Vision Badge
    $('#speed').text(currentCharacter.misc.speed);
    $('#vision').text(currentCharacter.misc.vision);

        //Populate Attacks
    $.each(currentCharacter.attacks, function(key, value){
        const scoreLookup = value[1];
        const atkBonus = value[0] * proficiencyModifier + abilityModifiers[scoreLookup] + value[2];
        const damage = `${value[4]}+${abilityModifiers[scoreLookup] + value[3]}`;
        const attackSpan = `<span class="atkItem infoInput row growText"><div class="atkName textDefault">${key}</div><div class="atkBns textDefault">+${atkBonus}</div><div class="atkDmg textDefault">${damage}</div><div class="atkRng textDefault">${value[5]}</div></span>`
        $('#attackWrapper').append(attackSpan);
    });

        //Populate Character Details
    $.each(currentCharacter.details, function(key, value){
        const detailArticle = `<article class="detailHeader"><span class="row"><img class="edit" src="img/Pencil-Grey.png" alt="Edit Entry" title="Edit Entry">${key}</span><div class="detailInfo growText">${value}</div></article>`
        $('#charInfoList').append(detailArticle);
    });

        //Populate Inventory
    let attunedCount = 0
    $.each(currentCharacter.inventory, function(key, value){
        let attunement = ""
        let equipped = ""
        let listItem = ""
        if (value[2] && value[3]) {attunedCount+= 1}
        if (value[2]) {attunement = '<p title="Requires Attunement">A</p>'} else {attunement = '<p></p>'};
        if (value[3]) {equipped = '<div class="isEquipped equipped" title="Equip/Unequip Item"></div>'} else {equipped = '<div class="isEquipped" title="Equip/Unequip Item"></div>'}
        if (value[3]) {listItem = '<li class="row growText equippedList">'} else {listItem = '<li class="row growText">'}
        const itemDetail = `${listItem}<p>${value[1]}x</p>${value[0]}${attunement}${equipped}</li>`
        $('#inventory').append(itemDetail);
    });
    if (attunedCount > 0) {$('#inventory').parent().prepend(`<div class="attunement" title="Items Attuned">${attunedCount}</div>`)}

        //Populate Coin
    $('#ppAmount').val(currentCharacter.misc.coin[0]);
    $('#gpAmount').val(currentCharacter.misc.coin[1]);
    $('#spAmount').val(currentCharacter.misc.coin[2]);
    $('#cpAmount').val(currentCharacter.misc.coin[3]);

        //Populate Spell Attack & DC
    let spellAtk = proficiencyModifier + abilityModifiers[currentCharacter.spells.spellStats[0]] + currentCharacter.spells.spellStats[1];
    if (spellAtk > 0) {spellAtk = "+" + spellAtk}
    $('#spellAttack1').text(spellAtk);
    $('#spellDC1').text(8 + proficiencyModifier + abilityModifiers[currentCharacter.spells.spellStats[0]] + currentCharacter.spells.spellStats[2] )

        //Populate Spells List
    let memorizedCount = 0
    $.each(currentCharacter.spells.spellsList, function(spellLvl, value){
        $(value).each(function(key2, spellDetails){
            let isRitual = ""
            let isConcentration = ""
            let isMemorized = ""
            if (spellDetails[1]) {isRitual = '<p title="Ritual Spell">R</p>'} else {isRitual = '<p></p>'};
            if (spellDetails[2]) {isConcentration = '<p title="Requires Concentration">C</p>'} else {isConcentration = '<p></p>'};
            if (spellDetails[3]) {
                isMemorized = '<span>';
                if (spellLvl !== "spellCantrip") {memorizedCount += 1;}
            } else {isMemorized = '<span class="notMemorized">'};
            let spellInfo = `<li>${isMemorized}${spellDetails[0]}</span>${isRitual}${isConcentration}<img class="trash" src="img/trash.png" alt="Remove Spell" title="Remove Spell"></li>`
            $(`#${spellLvl}`).append(spellInfo);
        });
    });
    $('#spellMemorized').text(memorizedCount);

        //Populate Spells Slots
    $.each(currentCharacter.spells.spellCasts, function(key, value){
        $(`#${key}`).append(`${value[0]} / ${value[1]}`);
        if (value[1] === 0) {$(`#${key}`).parent().parent().hide()};
    });
}

window.onload = populateSheet();