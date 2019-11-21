
//Load Test Character and Parse
const request = new XMLHttpRequest();
request.open("GET", "../TestChar.json", false);
request.send(null)
const currentCharacter = JSON.parse(request.responseText);



//Populate Sheet

    //Populate Character Info
let characterLevelTotal = 0
$.each(currentCharacter.charInfo, function(key, value){
    if (key === "characterLevel") {
        let classLevelText = ""
        let classLevelTotal = 0
        $.each(currentCharacter.charInfo.characterLevel, function(charClass, charLvl){
            classLevelText += `${charClass} ${charLvl}, `;
            classLevelTotal += parseInt(charLvl);
        });
        classLevelText = classLevelText.slice(0, -2);
        classLevelText+= ` [${classLevelTotal}]`
        characterLevelTotal = classLevelTotal
        $(`#${key}`).text(classLevelText);
    } else {
    $(`#${key}`).text(value);
    }
});


    //Polulate Ability Scores & Generate Ability Modifiers
const abilityModifiers = []
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


    //Generate Proficiency Bonus
const proficiencyModifier = Math.floor((characterLevelTotal-1)/4)+2
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

    //Populate Skills
$.each(currentCharacter.skills, function(key, value){
    const scoreLookup = value[1];
    let profImg = "";
    if (value[0] === 2) {
        profImg = '<img class="profImg" src="img/Blades-Solid-Shield.png" alt="Expertise" title="Expertise"></img>'
    } else if (value[0] === 1){
        profImg = '<img class="profImg" src="img/Solid-Shield.png" alt="Proficient" title="Proficient"></img>'
    } else if (value[0] === 0.5){
        profImg = '<img class="profImg" src="img/Blades-Hollow-Shield.png" alt="Half-Proficient" title="Half-Proficient"></img>'
    } else {
    profImg = '<img class="profImg" src="img/Hollow-Shield.png" alt="Non-Proficient" title="Non-Proficient">'
    }
    let skillBonus = Math.floor(proficiencyModifier * value[0]) + abilityModifiers[scoreLookup] + value[2];
    $(`#${key}`).text(skillBonus);
    $(`#${key}`).parent().prepend(profImg);
});


    //Populate Attacks
$.each(currentCharacter.attacks, function(key, value){
    const scoreLookup = value[1];
    const atkBonus = value[0] * proficiencyModifier + abilityModifiers[scoreLookup] + value[2];
    const damage = `${value[4]}+${abilityModifiers[scoreLookup] + value[3]}`;
    const attackSpan = `<span class="atkItem infoInput row grow20"><div class="atkName textDefault">${key}</div><div class="atkBns textDefault">+${atkBonus}</div><div class="atkDmg textDefault">${damage}</div><div class="atkRng textDefault">${value[5]}</div></span>`
    $('#attackWrapper').append(attackSpan);
});


    //Populate Character Details
$.each(currentCharacter.details, function(key, value){
    const detailArticle = `<article class="detailHeader">${key}<div class="detailInfo growText">${value}</div></article>`
    $('#charInfoList').append(detailArticle);
});

    //Populate Inventory

$.each(currentCharacter.inventory, function(key, value){
    let attunement = ""
    let equipped = ""

    if (value[2]) {attunement = '<p title="Requires Attunement">A</p>'} else {attunement = '<p></p>'};
    if (value[3]) {equipped = '<div class="isEquipped equipped" title="Equip/Unequip Item"></div>'} else {equipped = '<div class="isEquipped" title="Equip/Unequip Item"></div>'}

    const itemDetail = `<li class="row"><p>${value[1]}x</p>${value[0]}${attunement}${equipped}</li>`
    $('#inventory').append(itemDetail);
});

//<li class="row"><p>1x</p>Special Sword<p title="Requires Attunement">A</p><div class="isEquipped equipped" title="Equip/Unequip Item"></div>
