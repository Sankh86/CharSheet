//  ********** Initialize Firebase **********
firebase.initializeApp({
    apiKey: "AIzaSyAWuZWgghzD0ap5b7FQeqOkQwjXZq1B8ik",
    authDomain: "charactersheet5e.firebaseapp.com",
    projectId: "charactersheet5e",
    messagingSenderId: "542586822557",
    appId: "1:542586822557:web:b7f1eb1e7e4a2e52315974",
    measurementId: "G-DG0PD1Z4X0"
});


//  ********** Firebase Ref **********
const db = firebase.firestore();
const auth = firebase.auth();
let dbCharRef = ""
let loggedIn = false;


function populateSheet() {
    //  ********** Sheet Variables **********
    let characterLevelTotal = 0;
    const abilityModifiers = [];
    const abilityRef = ["Cha","Con","Dex","Int","Str","Wis","None"];
    let proficiencyModifier = 0;
    let passivePerception = 0;
    let initBonus = 0;
    const maxHitDice = [0,0,0,0];
    let attunedCount = 0;
    let memorizedCount = 0;


    //  ********** Populate Sheet **********
            //  ***** Populate Character Info *****
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


            //  ***** Polulate Ability Scores & Generate Ability Modifiers *****
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


            //  ***** Generate Proficiency Bonus *****
    proficiencyModifier = Math.floor((characterLevelTotal - 1) / 4) + 2 + currentCharacter.misc.proficiencyBonus;
    $('#profBonus').text(`+${proficiencyModifier}`);


            //  ***** Populate Saving Throws *****
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


            //  ***** Populate Skills & Passive Perception *****
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


            //  ***** Populate Badges *****
                //  ***Initiative Badge ***
    initBonus = abilityModifiers[2] + abilityModifiers[currentCharacter.misc.initiative['miscScore']] + currentCharacter.misc.initiative['misc'];
    if (initBonus > 0) {initBonus = "+" + initBonus};
    $('#initiativeBonus').text(initBonus);


                //  *** Armor Class Badge ***
    armor = function() {
        if (currentCharacter.misc.armorClass['maxDex'] > abilityModifiers[2]) {
            dexBon = abilityModifiers[2]} else {dexBon = currentCharacter.misc.armorClass['maxDex']};
        const armor = currentCharacter.misc.armorClass['armor'] + dexBon + currentCharacter.misc.armorClass['shield'] + currentCharacter.misc.armorClass['misc'] + abilityModifiers[currentCharacter.misc.armorClass['miscScore']];
        return armor
    }
    $('#armorClass').text(armor);


                //  *** HP Badge ***
    $('#hitPoints').text(currentCharacter.misc.hitPoints['currentHP'] + currentCharacter.misc.hitPoints['tempHP']);


                //  *** Hit Dice Badge ***
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


                //  *** Speed & Vision Badge ***
    $('#speed').text(currentCharacter.misc.speed);
    $('#vision').text(currentCharacter.misc.vision);
            //  ***** END Populate Badges *****


        //  ***** Populate Attacks *****
    $('#attackWrapper').children('span').not('span:first').remove();
    $.each(currentCharacter.attacks, function(key, value){
        const cAtk = currentCharacter.attacks
        const scoreLookup = cAtk[key]['score'];
        const atkBonus = cAtk[key]['prof'] * proficiencyModifier + abilityModifiers[scoreLookup] + cAtk[key]['atkBon'];
        const damage = `${cAtk[key]['damage']}+${abilityModifiers[scoreLookup] + cAtk[key]['dmgBon']}`;
        const attackSpan = `<span class="atkItem infoInput row growText"><div class="atkName textDefault">${key}</div><div class="atkBns textDefault">+${atkBonus}</div><div class="atkDmg textDefault">${damage}</div><div class="atkRng textDefault">${cAtk[key]['range']}</div></span>`
        $('#attackWrapper').append(attackSpan);
    });


        //  ***** Populate Character Details *****
    $('#charInfoList').empty();
    $.each(currentCharacter.details, function(key, value){
        const cDetail = currentCharacter.details
        const detailArticle = `<article class="detailHeader"><span class="row"><img class="edit" src="img/Pencil-Grey.png" alt="Edit Entry" title="Edit Entry">${cDetail[key]['detailName']}</span><div class="detailInfo growText">${cDetail[key]['detailInfo']}</div></article>`
        $('#charInfoList').append(detailArticle);
    });


        //  ***** Populate Inventory *****
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


        //  ***** Populate Coin *****
    $('#ppAmount').val(currentCharacter.misc.coin['pp']);
    $('#gpAmount').val(currentCharacter.misc.coin['gp']);
    $('#spAmount').val(currentCharacter.misc.coin['sp']);
    $('#cpAmount').val(currentCharacter.misc.coin['cp']);


        //  ***** Populate Spell Attack & DC *****
    let spellAtk = proficiencyModifier + abilityModifiers[currentCharacter.spells.spellStats['score']] + currentCharacter.spells.spellStats['atkMod'];
    if (spellAtk > 0) {spellAtk = "+" + spellAtk}
    $('#spellAttack1').text(spellAtk);
    $('#spellDC1').text(8 + proficiencyModifier + abilityModifiers[currentCharacter.spells.spellStats['score']] + currentCharacter.spells.spellStats['dcMod'] )


        //  ***** Populate Spells List *****
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


        //  ***** Populate Spells Slots *****
    $.each(currentCharacter.spells.spellCasts, function(key, value){
        cCasts = currentCharacter.spells.spellCasts
        $(`#${key}`).text(`${cCasts[key]['remain']} / ${cCasts[key]['total']}`);
        if (cCasts[key]['total'] === 0) {$(`#${key}`).parent().parent().hide()};
    });
    //  ********** END Populate Sheet **********
};


function sortObjKeysAlphabetically(obj) {
    const ordered = {};
    Object.keys(obj).sort().forEach(function(key) {
        ordered[key] = obj[key];
    });
    return ordered;
};


// ***** Create New User & Log In *****
// const newuserform = document.querySelector("#newuser-form");
// newuserform.addEventListener('submit', function (e) {
//     e.preventDefault();

//     let email = document.getElementById("newuser-email").value
//     let pw = document.getElementById("newuser-pw").value
//     let firstname = document.getElementById("newuser-firstname").value

//     auth.createUserWithEmailAndPassword(email, pw).then(cred => {
//         acctform.style.display = "none";
//         newuserform.reset();

//         let user = auth.currentUser;
//         let uid = user.uid;

//         user.updateProfile({displayName: firstname});
//         db.collection("Users").doc(uid).set({ complete: [ ], critnpress: [ ], critpress: [ ], ncritnpress: [ ], ncritpress: [ ] });

//     //   .catch(function(error) {
//     //     // Handle Errors here.
//     //     var errorCode = error.code;
//     //     var errorMessage = error.message;
//     //     // ...
//     //   });

//         console.log("User Created");
//     });
// });


//  ********** Login **********
$('#loginForm input[type="submit"]').on('click', function(e){
    e.preventDefault();
    const loginEmail = $('#loginEmail').val();
    const loginPW = $('#loginPW').val();
    auth.signInWithEmailAndPassword(loginEmail, loginPW).then(cred => {
        console.log("User Logged In");
        $('#loginEmail').val(null);
        $('#loginPW').val(null);
    });
});


//  ********** Logout **********
$('#logoutBtn').on('click', function(){
    auth.signOut().then(() => {console.log('User Logged Out')});
});


// ***** Auth State Changes *****
    auth.onAuthStateChanged(user => {
        if(user) {
            uid = user.uid;
            const displayName = user.displayName;
            loggedIn = true;
            $('#restButton').css('display','inline-block');
            $('#loginBtn').css('display','none');
            $('#characterButton').css('display','inline-block');
            $('#acctBtn').css('display','inline-block');
            $('#howdy').hide();
            dbCharRef = db.collection("Users").doc(uid).collection('Characters').doc('Obliviaron')
            dbCharRef.get().then((snapshot) => {
                currentCharacter = snapshot.data();
                populateSheet();
            });

        } else {
            uid = "";
            loggedIn = false;
            $('#restButton').css('display','none');
            $('#loginBtn').css('display','inline-block');
            $('#characterButton').css('display','none');
            $('#acctBtn').css('display','none');
            $('#howdy').show();
            currentCharacter = {"abilityScores":{"chaScore":8,"conScore":15,"dexScore":13,"intScore":16,"strScore":18,"wisScore":10},"attacks":{"Longsword":{"atkBon":0,"damage":"1d8","dmgBon":0,"prof":1,"range":"Melee","score":4}},"charInfo":{"characterAlignment":"Chaotic-Good","characterBackground":"Outlander","characterLevel":{"Fighter":{"hd":2,"lvl":3},"Rogue":{"hd":1,"lvl":2},"Wizard":{"hd":0,"lvl":5}},"characterName":"Obliviaron","characterRace":"Human"},"details":{"1":{"detailInfo":"You are good with maps and places, and generally have a firm understanding of your surroundings. You can also find food and fresh water for yourself and up to five others each day, provided the land can sustain such goods.","detailName":"Outlander"},"0":{"detailInfo":"Light Armor, Medium Armor, Heavy Armor, Shields, Simple Weapons, Martial Weapons, Flute","detailName":"Proficiencies"}},"inventory":{"Breastplate":{"attune":false,"equipped":true,"qty":1},"Longbow":{"attune":false,"equipped":true,"qty":1},"Longsword":{"attune":false,"equipped":true,"qty":1},"Potion of Healing - 2d4+2":{"attune":false,"equipped":false,"qty":3}},"misc":{"abilityBadges":{},"armorClass":{"armor":15,"maxDex":2,"misc":0,"miscScore":6,"shield":2},"coin":{"cp":"50","gp":"500","pp":"50","sp":"200"},"hitDice":{"d10":3,"d12":0,"d6":5,"d8":2,"recover":"half"},"hitPoints":{"currentHP":70,"maxHP":70,"maxMod":0,"tempHP":0},"initiative":{"misc":0,"miscScore":6},"passivePerceptionBonus":{"misc":0,"miscScore":6},"proficiencyBonus":0,"speed":"30","vision":"Darkvision 60","xp":"7500"},"savingThrows":{"chaSave":{"misc":0,"miscScore":6,"prof":0,"score":0},"conSave":{"misc":0,"miscScore":6,"prof":1,"score":1},"dexSave":{"misc":0,"miscScore":6,"prof":0,"score":2},"intSave":{"misc":0,"miscScore":6,"prof":0,"score":3},"strSave":{"misc":0,"miscScore":6,"prof":1,"score":4},"wisSave":{"misc":0,"miscScore":6,"prof":0,"score":5}},"skills":{"Acrobatics":{"misc":0,"prof":1,"score":2},"Arcana":{"misc":0,"prof":1,"score":3},"Athletics":{"misc":0,"prof":2,"score":4},"Deception":{"misc":0,"prof":0,"score":0},"History":{"misc":0,"prof":0,"score":3},"Insight":{"misc":0,"prof":0,"score":5},"Intimidation":{"misc":0,"prof":0,"score":0},"Investigation":{"misc":0,"prof":0,"score":3},"Medicine":{"misc":0,"prof":0,"score":5},"Nature":{"misc":0,"prof":0,"score":3},"Perception":{"misc":0,"prof":1,"score":5},"Performance":{"misc":0,"prof":0,"score":0},"Persuasion":{"misc":0,"prof":0,"score":0},"Religion":{"misc":0,"prof":0,"score":3},"Sleight of Hand":{"misc":0,"prof":0,"score":2},"Stealth":{"misc":0,"prof":2,"score":2},"Survival":{"misc":0,"prof":0,"score":5}},"spells":{"spellCasts":{"spellEighthCasts":{"remain":0,"total":0},"spellFifthCasts":{"remain":0,"total":0},"spellFirstCasts":{"remain":4,"total":4},"spellFourthCasts":{"remain":0,"total":0},"spellNinthCasts":{"remain":0,"total":0},"spellSecondCasts":{"remain":3,"total":3},"spellSeventhCasts":{"remain":0,"total":0},"spellSixthCasts":{"remain":0,"total":0},"spellThirdCasts":{"remain":2,"total":2}},"spellStats":{"atkMod":0,"dcMod":0,"reset":"longRest","score":3},"spellsList":{"spellCantrip":{"Dancing Lights":{"isConc":true,"isMem":true,"isRitual":false},"Firebolt":{"isConc":false,"isMem":true,"isRitual":false},"Green-Flame Blade":{"isConc":false,"isMem":true,"isRitual":false},"Mending":{"isConc":false,"isMem":true,"isRitual":false}},"spellEighth":{},"spellFifth":{},"spellFirst":{"Chromatic Orb":{"isConc":false,"isMem":true,"isRitual":false},"Comprehend Languages":{"isConc":false,"isMem":false,"isRitual":true},"Detect Magic":{"isConc":true,"isMem":true,"isRitual":true},"Expeditious Retreat":{"isConc":true,"isMem":true,"isRitual":false},"Identify":{"isConc":false,"isMem":false,"isRitual":true},"Magic Missile":{"isConc":false,"isMem":true,"isRitual":false},"Shield":{"isConc":false,"isMem":false,"isRitual":false}},"spellFourth":{},"spellNinth":{},"spellSecond":{"Invisibility":{"isConc":true,"isMem":true,"isRitual":false},"Shatter":{"isConc":false,"isMem":false,"isRitual":false},"Spider Climb":{"isConc":true,"isMem":false,"isRitual":false},"Web":{"isConc":true,"isMem":true,"isRitual":false}},"spellSeventh":{},"spellSixth":{},"spellThird":{"Fireball":{"isConc":false,"isMem":true,"isRitual":false},"Haste":{"isConc":true,"isMem":true,"isRitual":false},"Leomund's Tiny Hut":{"isConc":false,"isMem":false,"isRitual":true}}}}}
            populateSheet();
        }
    });


//  ********** On Click Hooks **********
$(document).mouseup(function(e){
    //  Change Quantity - Remove Qty Changer Element on Focus Out
    if (!$('#qtyForm').is(e.target) && $('#qtyForm').has(e.target).length === 0) {
        $('#qtyForm').remove();
    }
    //  Settings Form - Remove Element on Focus Out
    if (!$('.settingsBox').is(e.target) && $('.settingsBox').has(e.target).length === 0) {
        $('.settingsBox').remove();
    }
});


//  ********** Menu Burger **********
  $('header').on('click', '.burgerMenu', function(){
    $('#topMenu').toggleClass('isActive');
});


//  ********** Menu Bar **********
$('header').on('mouseover', 'h3', function(){
    $(this).children().show();
});
$('header').on('mouseleave', 'h3', function(){
    $(this).children().hide();
});


//  ********** Update XP Total **********
$('#charExperience input[type="submit"]').on('click', function(e){
    e.preventDefault();
    const xpTotal = parseInt($('#characterXP').val());
    currentCharacter.misc.xp = xpTotal;
    $('#characterXP').blur();
    const update = {}
    update['misc.xp'] = currentCharacter.misc.xp;
    if (loggedIn) {dbCharRef.update(update)};
    populateSheet();
});
$('#characterXP').on('focusout', function(){
    const xpTotal = $('#characterXP').val();
    currentCharacter.misc.xp = xpTotal;
    const update = {}
    update['misc.xp'] = currentCharacter.misc.xp;
    if (loggedIn) {dbCharRef.update(update)};
    populateSheet();
});


//  ********** Settings Form **********
    //  ***** Settings Form - Cancel Button *****
$('body').on('click', '.settingsCancel', function(e){
    e.preventDefault();
    $('.settingsBox').remove();
});

    //  ***** Settings Form - Click Settings Icon *****
$('body').on('click', '.settingsIcon', function(){
    $('.settingsBox').remove();
    $('body').append(`<section class="settingsBox"><form class="scroll"></form></section>`);
    const settingsTitle = $(this).attr('title');
    let settingsHeader = `<h3>${settingsTitle}</h3>`


        //  *** Saving Throws ***
    if (settingsTitle === "Saving Throw Settings") {
        settingsHeader += `<div><p class="saveC1">Ability</p><p class="saveC2">Proficiency</p><p class="saveC3">Bonus</p></div>`
        $('.settingsBox').prepend(settingsHeader);
        settingsForm = `<section>
                            <p class="saveC1">Strength</p>
                            <input type="checkbox" id="strSaveProf" class="settingsCheckbox">
                            <label for="strSaveProf" class="saveC2">Proficient</label>
                            <input type="number" id="strSaveMod" class="saveC3">
                        </section>
                        <section>
                            <p class="saveC1">Dexterity</p>
                            <input type="checkbox" id="dexSaveProf" class="settingsCheckbox">
                            <label for="dexSaveProf" class="saveC2">Proficient</label>
                            <input type="number" id="dexSaveMod" class="saveC3">
                        </section>
                        <section>
                            <p class="saveC1">Constitution</p>
                            <input type="checkbox" id="conSaveProf" class="settingsCheckbox">
                            <label for="conSaveProf" class="saveC2">Proficient</label>
                            <input type="number" id="conSaveMod" class="saveC3">
                        </section>
                        <section>
                            <p class="saveC1">Intelligence</p>
                            <input type="checkbox" id="intSaveProf" class="settingsCheckbox">
                            <label for="intSaveProf" class="saveC2">Proficient</label>
                            <input type="number" id="intSaveMod" class="saveC3">
                        </section>
                        <section>
                            <p class="saveC1">Wisdom</p>
                            <input type="checkbox" id="wisSaveProf" class="settingsCheckbox">
                            <label for="wisSaveProf" class="saveC2">Proficient</label>
                            <input type="number" id="wisSaveMod" class="saveC3">
                        </section>
                        <section>
                            <p class="saveC1">Charisma</p>
                            <input type="checkbox" id="chaSaveProf" class="settingsCheckbox">
                            <label for="chaSaveProf" class="saveC2">Proficient</label>
                            <input type="number" id="chaSaveMod" class="saveC3">
                        </section>
                        <section>
                            <label for="addToSaves" class="saveC1">Add to Saves:</label>
                            <select id="addToSaves" class="saveC2-C3">
						        <option value=6>None</option>
						        <option value=4>Strength</option>
						        <option value=2>Dexterity</option>
						        <option value=1>Constitution</option>
						        <option value=3>Intelligence</option>
						        <option value=5>Wisdom</option>
						        <option value=0>Charisma</option>
                            </select>
                        </section>
                        <input type="submit" value="Update">
                        <button class="settingsCancel">Cancel</button>`
        $('.settingsBox form').append(settingsForm);
        if (currentCharacter.savingThrows.strSave.prof === 1) {$('#strSaveProf').prop('checked', true)};
        if (currentCharacter.savingThrows.dexSave.prof === 1) {$('#dexSaveProf').prop('checked', true)};
        if (currentCharacter.savingThrows.conSave.prof === 1) {$('#conSaveProf').prop('checked', true)};
        if (currentCharacter.savingThrows.intSave.prof === 1) {$('#intSaveProf').prop('checked', true)};
        if (currentCharacter.savingThrows.wisSave.prof === 1) {$('#wisSaveProf').prop('checked', true)};
        if (currentCharacter.savingThrows.chaSave.prof === 1) {$('#chaSaveProf').prop('checked', true)};
        $('#strSaveMod').val(currentCharacter.savingThrows.strSave.misc);
        $('#dexSaveMod').val(currentCharacter.savingThrows.dexSave.misc);
        $('#conSaveMod').val(currentCharacter.savingThrows.conSave.misc);
        $('#intSaveMod').val(currentCharacter.savingThrows.intSave.misc);
        $('#wisSaveMod').val(currentCharacter.savingThrows.wisSave.misc);
        $('#chaSaveMod').val(currentCharacter.savingThrows.chaSave.misc);
        $('#addToSaves').val(currentCharacter.savingThrows.strSave.miscScore);
        $('.settingsBox input[type="submit"]').on('click', function(e){
            e.preventDefault();
            const saveSnapshot = JSON.stringify(currentCharacter.savingThrows);
            if ($('#strSaveProf').prop('checked')) {currentCharacter.savingThrows.strSave.prof = 1} else {currentCharacter.savingThrows.strSave.prof = 0};
            if ($('#dexSaveProf').prop('checked')) {currentCharacter.savingThrows.dexSave.prof = 1} else {currentCharacter.savingThrows.dexSave.prof = 0};
            if ($('#conSaveProf').prop('checked')) {currentCharacter.savingThrows.conSave.prof = 1} else {currentCharacter.savingThrows.conSave.prof = 0};
            if ($('#intSaveProf').prop('checked')) {currentCharacter.savingThrows.intSave.prof = 1} else {currentCharacter.savingThrows.intSave.prof = 0};
            if ($('#wisSaveProf').prop('checked')) {currentCharacter.savingThrows.wisSave.prof = 1} else {currentCharacter.savingThrows.wisSave.prof = 0};
            if ($('#chaSaveProf').prop('checked')) {currentCharacter.savingThrows.chaSave.prof = 1} else {currentCharacter.savingThrows.chaSave.prof = 0};
            currentCharacter.savingThrows.strSave.misc = parseInt($('#strSaveMod').val());
            currentCharacter.savingThrows.dexSave.misc = parseInt($('#dexSaveMod').val());
            currentCharacter.savingThrows.conSave.misc = parseInt($('#conSaveMod').val());
            currentCharacter.savingThrows.intSave.misc = parseInt($('#intSaveMod').val());
            currentCharacter.savingThrows.wisSave.misc = parseInt($('#wisSaveMod').val());
            currentCharacter.savingThrows.chaSave.misc = parseInt($('#chaSaveMod').val());
            currentCharacter.savingThrows.strSave.miscScore = parseInt($('#addToSaves').val());
            currentCharacter.savingThrows.dexSave.miscScore = parseInt($('#addToSaves').val());
            currentCharacter.savingThrows.conSave.miscScore = parseInt($('#addToSaves').val());
            currentCharacter.savingThrows.intSave.miscScore = parseInt($('#addToSaves').val());
            currentCharacter.savingThrows.wisSave.miscScore = parseInt($('#addToSaves').val());
            currentCharacter.savingThrows.chaSave.miscScore = parseInt($('#addToSaves').val());
            const isEqual = saveSnapshot === JSON.stringify (currentCharacter.savingThrows);
            const update = {};
            update['savingThrows'] = currentCharacter.savingThrows;
            if (loggedIn && !(isEqual)) {dbCharRef.set(update,{merge:true})};
            populateSheet();
            $('.settingsBox').remove();
        });
    }

    if (settingsTitle === "Spell Settings") {
        settingsHeader += `<div><p class="spellC1">Casting Ability</p><p class="spellC2">Atk Mod</p><p class="spellC3">DC Mod</p></div>`
        $('.settingsBox').prepend(settingsHeader);
        settingsForm = `<section>
                            <select id="spellAbility" class="spellC1">
						        <option value=6>None</option>
						        <option value=4>Strength</option>
						        <option value=2>Dexterity</option>
					            <option value=1>Constitution</option>
					            <option value=3>Intelligence</option>
					            <option value=5>Wisdom</option>
					            <option value=0>Charisma</option>
                            </select>
                            <input type="number" id="spellAtk" class="spellC2">
                            <input type="number" id="spellDC" class="spellC3">
                        </section>
                        <section>
                            <label for="spellRecover" class="spellC1">Spell Recovery:</label>
                            <select id="spellRecover" class="spellC2&3">
						        <option value="longRest">Long Rest</option>
                                <option value="shortRest">Short Rest</option>
                            </select>
                        </section>
                        <h3>Spells Per Rest</h3>
                        <div>
                            <p class="spellC1">Spell Level</p>
                            <p class="spellC3"># Casts</p>
                        </div>
                        <section>
                            <label for="spellFirstPR" class="spellC1">1st Level</label>
                            <input type="number" id="spellFirstPR" class="spellC3">
                        </section>
                        <section>
                            <label for="spellSecondPR" class="spellC1">2nd Level</label>
                            <input type="number" id="spellSecondPR" class="spellC3">
                        </section>
                        <section>
                            <label for="spellThirdPR" class="spellC1">3rd Level</label>
                            <input type="number" id="spellThirdPR" class="spellC3">
                        </section>
                        <section>
                            <label for="spellFourthPR" class="spellC1">4th Level</label>
                            <input type="number" id="spellFourthPR" class="spellC3">
                        </section>
                        <section>
                            <label for="spellFifthPR" class="spellC1">5th Level</label>
                            <input type="number" id="spellFifthPR" class="spellC3">
                        </section>
                        <section>
                            <label for="spellSixthPR" class="spellC1">6th Level</label>
                            <input type="number" id="spellSixthPR" class="spellC3">
                        </section>
                        <section>
                            <label for="spellSeventhPR" class="spellC1">7th Level</label>
                            <input type="number" id="spellSeventhPR" class="spellC3">
                        </section>
                        <section>
                            <label for="spellEighthPR" class="spellC1">8th Level</label>
                            <input type="number" id="spellEighthPR" class="spellC3">
                        </section>
                        <section>
                            <label for="spellNinthPR" class="spellC1">9th Level</label>
                            <input type="number" id="spellNinthPR" class="spellC3">
                        </section>
                        <input type="submit" value="Update">
                        <button class="settingsCancel">Cancel</button>`
        $('.settingsBox form').append(settingsForm);
        $('#spellAbility').val(currentCharacter.spells.spellStats.score);
        $('#spellAtk').val(currentCharacter.spells.spellStats.atkMod);
        $('#spellDC').val(currentCharacter.spells.spellStats.dcMod);
        $('#spellRecover').val(currentCharacter.spells.spellStats.reset);
        $('#spellFirstPR').val(currentCharacter.spells.spellCasts.spellFirstCasts.total);
        $('#spellSecondPR').val(currentCharacter.spells.spellCasts.spellSecondCasts.total);
        $('#spellThirdPR').val(currentCharacter.spells.spellCasts.spellThirdCasts.total);
        $('#spellFourthPR').val(currentCharacter.spells.spellCasts.spellFourthCasts.total);
        $('#spellFifthPR').val(currentCharacter.spells.spellCasts.spellFifthCasts.total);
        $('#spellSixthPR').val(currentCharacter.spells.spellCasts.spellSixthCasts.total);
        $('#spellSeventhPR').val(currentCharacter.spells.spellCasts.spellSeventhCasts.total);
        $('#spellEighthPR').val(currentCharacter.spells.spellCasts.spellEighthCasts.total);
        $('#spellNinthPR').val(currentCharacter.spells.spellCasts.spellNinthCasts.total);
        $('.settingsBox input[type="submit"]').on('click', function(e){
            e.preventDefault();
            const saveSnapshot = JSON.stringify(currentCharacter.spells);
            currentCharacter.spells.spellStats.score = parseInt($('#spellAbility').val());
            currentCharacter.spells.spellStats.atkMod = parseInt($('#spellAtk').val());
            currentCharacter.spells.spellStats.dcMod = parseInt($('#spellDC').val());
            currentCharacter.spells.spellStats.reset = $('#spellRecover').val();
            currentCharacter.spells.spellCasts.spellFirstCasts.total = parseInt($('#spellFirstPR').val());
            currentCharacter.spells.spellCasts.spellSecondCasts.total = parseInt($('#spellSecondPR').val());
            currentCharacter.spells.spellCasts.spellThirdCasts.total = parseInt($('#spellThirdPR').val());
            currentCharacter.spells.spellCasts.spellFourthCasts.total = parseInt($('#spellFourthPR').val());
            currentCharacter.spells.spellCasts.spellFifthCasts.total = parseInt($('#spellFifthPR').val());
            currentCharacter.spells.spellCasts.spellSixthCasts.total = parseInt($('#spellSixthPR').val());
            currentCharacter.spells.spellCasts.spellSeventhCasts.total = parseInt($('#spellSeventhPR').val());
            currentCharacter.spells.spellCasts.spellEighthCasts.total = parseInt($('#spellEighthPR').val());
            currentCharacter.spells.spellCasts.spellNinthCasts.total = parseInt($('#spellNinthPR').val());
            const isEqual = saveSnapshot === JSON.stringify (currentCharacter.spells);
            const update = {};
            update['spells.'+'spellCasts'] = currentCharacter.spells.spellCasts;
            // update['spells.'+'spellStats'] = currentCharacter.spells.spellStats;
            if (loggedIn && !(isEqual)) {dbCharRef.set(update,{merge:true})};
            populateSheet();
            $('.settingsBox').remove();
        });
    }
});

    //  ***** Settings Form - Submit Saving Throws *****
$('body').on('click', '.settingsCancel', function(e){
    e.preventDefault();
    $('.settingsBox').remove();
});



//  ********** Inventory Management **********
        //  ***** Add Item to Inventory *****
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
            if (loggedIn) {dbCharRef.set(update,{merge:true})};
            populateSheet();
        };
    };
});


        //  ***** Change Quantity - Insert Qty Changer Element *****
$('#inventory').on('click', '.relQty', function(){
    const itemName = $(this).parent().children('span').text();
    const itemQty = currentCharacter.inventory[itemName]['qty'];
    const qtyForm = `<form class="sectWrapper" id="qtyForm"><h3>${itemName}</h3><input type="number" id="newQty" class=""><input type="image" class="checkmark" name="submit" src="img/checkmark.png" alt="Submit" title="Submit"><img class="cancel" src="img/xmark.png" alt="Cancel" title="Cancel"><img class="trash" src="img/trash.png" alt="Remove Item" title="Remove Item"></form>`
    $(this).parent().append(qtyForm);
    $(this).parent().children('#qtyForm').children('#newQty').val(itemQty);
    $(this).parent().children('#qtyForm').focus();
});


        //  ***** Change Quantity - Remove Item *****
$('#inventory').on('click', '.trash', function(){
    const itemName = $(this).parent().parent().children('span').text();
    $('#qtyForm').remove()
    delete currentCharacter.inventory[itemName];
    const remove = {};
    remove['inventory.'+itemName] = firebase.firestore.FieldValue.delete();
    if (loggedIn) {dbCharRef.update(remove)};
    populateSheet();
});


        //  ***** Change Quantity - Cancel *****
$('#inventory').on('click', '.cancel', function(){
    $('#qtyForm').remove()
});


        //  ***** Change Quantity - Modify Amount *****
$('#inventory').on('click', 'input[type="image"]', function(e){
    e.preventDefault();
    const itemName = $(this).parent().parent().children('span').text();
    const currentQty = currentCharacter.inventory[itemName]['qty'];
    let newQty = parseInt($(this).parent().children('input[type="number"]').val());
    const update = {};
    if (isNaN(newQty) || newQty === "" || newQty === null) {newQty = currentQty};
    if (newQty === 0) {
        delete currentCharacter.inventory[itemName];
        update['inventory.'+itemName] = firebase.firestore.FieldValue.delete();
        if (loggedIn) {dbCharRef.update(update)};
        populateSheet();
    }
    if (newQty !== currentQty && newQty !== 0) {
        currentCharacter.inventory[itemName]['qty'] = newQty;
        update['inventory.'+itemName+'.qty'] = newQty;
        if (loggedIn) {dbCharRef.update(update)};
        populateSheet();
    }
    $('#qtyForm').remove();
});


        //  ***** Toggle Equipped *****
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
    if (loggedIn) {dbCharRef.update(update)};
    populateSheet();
});
//  ********** END Inventory Management **********


//  ********** Update Currency **********
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
        if (loggedIn) {dbCharRef.update(update)};
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
        if (loggedIn) {dbCharRef.update(update)};
        populateSheet();
    }
});


//  ********** Spell Management **********
        //  ***** Add Spell to List ******
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
        if (loggedIn) {dbCharRef.update(update)};
        populateSheet();
    }
});


        //  ***** Remove Spell from List *****
$('#spellList').on('click', '.trash', function(){
    const spellName = $(this).parent().children('article:first').text();
    const spellLvl = $(this).parent().parent().attr('id');
    delete currentCharacter.spells.spellsList[spellLvl][spellName]
    const remove = {};
    remove['spells.spellsList.'+spellLvl+'.'+spellName] = firebase.firestore.FieldValue.delete();
    if (loggedIn) {dbCharRef.update(remove)};
    populateSheet();
});


        //  ***** Toggle Memorization *****
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
    if (loggedIn) {dbCharRef.update(update)};
    populateSheet();
});
//  ********** END Spell Management **********