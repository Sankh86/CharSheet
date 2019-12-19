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
let dbUserRef = "";
let dbCharRef = "";
const dbCharList = []
let loggedIn = false;
let userData = "";
let currentCharacter = "";

//  ********** Other Ref **********
let showMoveBtn = false
const stdSkills = ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"]


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
    abilityModifiers.push(0);


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
    let stdSkillsList = "";
    let bnsSkillsList = "";
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
        skillString = `<span class="row skillItm">${profImg}<span class="skillTitle">${key} (${modRef})</span><div class="skillEntry infoInput" title="${key} Skill Bonus">${skillBonus}</div></span>`
        if (stdSkills.indexOf(key) !== -1) {stdSkillsList += skillString} else {bnsSkillsList += skillString};
    });
    if (bnsSkillsList !== "") {bnsSkillsList = `<section class="skillsDivider"></section>` + bnsSkillsList}
    $('#skillsInfoList').append(stdSkillsList).append(bnsSkillsList);
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
        const detailArticle = `<article class="detailHeader"><img class="moveUp" src="img/up-grey.png" title="Move Up"><img class="moveDown" src="img/down-grey.png" title="Move Down"><span class="detailID">${key}</span><span class="row"><img class="edit" src="img/Pencil-Grey.png" alt="Edit Entry" title="Edit Entry">${cDetail[key]['detailName']}</span><div class="detailInfo growText">${cDetail[key]['detailInfo']}</div></article>`
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
        let cSpell = currentCharacter.spells.spellsList[key];
        $.each(currentCharacter.spells.spellsList[key], function(key2, value2){
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
        if(Object.keys(cSpell).length === 0) {$(`#${key}`).hide()} else {$(`#${key}`).show()}
    });
    $('#spellMemorized').text(memorizedCount);


        //  ***** Populate Spells Slots *****
    $.each(currentCharacter.spells.spellCasts, function(key, value){
        const cCasts = currentCharacter.spells.spellCasts;
        const cSpellLvl = $(`#${key}`).parent().parent().children('ul').attr('id');
        const cSpell = currentCharacter.spells.spellsList[cSpellLvl];
        const remain = cCasts[key]['lrRemain'] + cCasts[key]['srRemain']
        const total = cCasts[key]['lrTotal'] + cCasts[key]['srTotal']
        $(`#${key}`).text(`${remain} / ${total}`);
        if (Object.keys(cSpell).length === 0 && total === 0) {$(`#${key}`).parent().parent().hide()} else {$(`#${key}`).parent().parent().show()};
        if (Object.keys(cSpell).length === 0) {
            $(`#${key}`).css({'border-bottom':'1px solid rgb(150, 150, 150)','border-bottom-left-radius':'5px','border-bottom-right-radius':'5px'})
        } else {
            $(`#${key}`).css({'border-bottom':'initial','border-bottom-left-radius':'0','border-bottom-right-radius':'0'})
        };
    });

    if(showMoveBtn) {
        $('#charInfoWrapper .moveDown').show();
        $('#charInfoWrapper .moveUp').show();
    } else {
        $('#charInfoWrapper .moveUp').hide();
        $('#charInfoWrapper .moveDown').hide();
    }

    //  ********** END Populate Sheet Function **********
};


function sortObjKeysAlphabetically(obj) {
    const ordered = {};
    Object.keys(obj).sort().forEach(function(key) {
        ordered[key] = obj[key];
    });
    return ordered;
};

function createCharList() {
    dbCharList.length = 0;
    dbUserRef.collection('Characters').get().then(snapshot => {
        snapshot.docs.forEach(doc => {dbCharList.push(doc.id)});
        $('#charactersList').children().remove();
        $.each(dbCharList, function(i){
            const charList = `<h4>${dbCharList[i]}</h4>`
            $('#charactersList').append(charList);
        });
    })
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
        $('#loginEmail').val(null);
        $('#loginPW').val(null);
    });
});


//  ********** Logout **********
$('#logoutBtn').on('click', function(){
    auth.signOut();
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
            dbUserRef = db.collection("Users").doc(uid);
            dbUserRef.get().then((snapshot) => {
                userData = snapshot.data();
                const lastSeen = userData.lastCharSeen;
                dbCharRef = db.collection("Users").doc(uid).collection('Characters').doc(lastSeen);
                dbCharRef.get().then((snapshot) => {
                    currentCharacter = snapshot.data();
                    createCharList();
                    populateSheet();
                });
            });
            dbCharList

        } else {
            uid = "";
            loggedIn = false;
            $('#restButton').css('display','none');
            $('#loginBtn').css('display','inline-block');
            $('#characterButton').css('display','none');
            $('#acctBtn').css('display','none');
            $('#howdy').show();
            currentCharacter = {"abilityScores":{"chaScore":8,"conScore":15,"dexScore":13,"intScore":16,"strScore":18,"wisScore":10},"attacks":{"Longsword":{"atkBon":0,"damage":"1d8","dmgBon":0,"prof":1,"range":"Melee","score":4}},"charInfo":{"characterAlignment":"Chaotic-Good","characterBackground":"Outlander","characterLevel":{"Fighter":{"hd":2,"lvl":3},"Rogue":{"hd":1,"lvl":2},"Wizard":{"hd":0,"lvl":5}},"characterName":"Obliviaron","characterRace":"Human","characterSaveName":"Obliviaron"},"details":{"1576187193468":{"detailInfo":"Light Armor, Medium Armor, Heavy Armor, Shields, Simple Weapons, Martial Weapons, Flute","detailName":"Proficiencies"},"1576187223619":{"detailInfo":"You have an excellent memory for maps and geography, and you can always recall the general layout of terrain, settlements, and other features around you. In addition, you can find food and fresh water for yourself and up to five other people each day, provided that the land offers berries, small game, water, and so forth","detailName":"Outlander"}},"inventory":{"Breastplate":{"attune":false,"equipped":true,"qty":1},"Longbow":{"attune":false,"equipped":true,"qty":1},"Longsword":{"attune":false,"equipped":true,"qty":1},"Potion of Healing - 2d4+2":{"attune":false,"equipped":true,"qty":3}},"misc":{"abilityBadges":{},"armorClass":{"armor":15,"maxDex":2,"misc":0,"miscScore":6,"shield":2},"coin":{"cp":"50","gp":"500","pp":"25","sp":"100"},"hitDice":{"d10":3,"d12":0,"d6":5,"d8":2,"recover":"half"},"hitPoints":{"currentHP":70,"maxHP":70,"maxMod":0,"tempHP":0},"initiative":{"misc":0,"miscScore":6},"passivePerceptionBonus":{"misc":0,"miscScore":6},"proficiencyBonus":0,"speed":"30","vision":"Darkvision 60","xp":8000},"savingThrows":{"chaSave":{"misc":0,"miscScore":6,"prof":0,"score":0},"conSave":{"misc":0,"miscScore":6,"prof":1,"score":1},"dexSave":{"misc":0,"miscScore":6,"prof":0,"score":2},"intSave":{"misc":0,"miscScore":6,"prof":0,"score":3},"strSave":{"misc":0,"miscScore":6,"prof":1,"score":4},"wisSave":{"misc":0,"miscScore":6,"prof":0,"score":5}},"skills":{"Acrobatics":{"misc":0,"prof":1,"score":2},"Animal Handling":{"misc":0,"prof":0,"score":5},"Arcana":{"misc":0,"prof":1,"score":3},"Athletics":{"misc":0,"prof":2,"score":4},"Deception":{"misc":0,"prof":0,"score":0},"History":{"misc":0,"prof":0,"score":3},"Insight":{"misc":0,"prof":0,"score":5},"Intimidation":{"misc":0,"prof":0,"score":0},"Investigation":{"misc":0,"prof":0,"score":3},"Medicine":{"misc":0,"prof":0,"score":5},"Nature":{"misc":0,"prof":0,"score":3},"Perception":{"misc":0,"prof":1,"score":5},"Performance":{"misc":0,"prof":0,"score":0},"Persuasion":{"misc":0,"prof":0,"score":0},"Religion":{"misc":0,"prof":0,"score":3},"Sleight of Hand":{"misc":0,"prof":0,"score":2},"Stealth":{"misc":0,"prof":2,"score":2},"Survival":{"misc":0,"prof":0,"score":5}},"spells":{"spellCasts":{"spellEighthCasts":{"lrRemain":0,"lrTotal":0,"srRemain":0,"srTotal":0},"spellFifthCasts":{"lrRemain":0,"lrTotal":0,"srRemain":0,"srTotal":0},"spellFirstCasts":{"lrRemain":4,"lrTotal":4,"srRemain":0,"srTotal":0},"spellFourthCasts":{"lrRemain":0,"lrTotal":0,"srRemain":0,"srTotal":0},"spellNinthCasts":{"lrRemain":0,"lrTotal":0,"srRemain":0,"srTotal":0},"spellSecondCasts":{"lrRemain":3,"lrTotal":3,"srRemain":0,"srTotal":0},"spellSeventhCasts":{"lrRemain":0,"lrTotal":0,"srRemain":0,"srTotal":0},"spellSixthCasts":{"lrRemain":0,"lrTotal":0,"srRemain":0,"srTotal":0},"spellThirdCasts":{"lrRemain":2,"lrTotal":2,"srRemain":0,"srTotal":0}},"spellStats":{"atkMod":0,"dcMod":0,"score":3},"spellsList":{"spellCantrip":{"Dancing Lights":{"isConc":true,"isMem":true,"isRitual":false},"Firebolt":{"isConc":false,"isMem":true,"isRitual":false},"Green-Flame Blade":{"isConc":false,"isMem":true,"isRitual":false},"Mending":{"isConc":false,"isMem":true,"isRitual":false}},"spellEighth":{},"spellFifth":{},"spellFirst":{"Chromatic Orb":{"isConc":false,"isMem":true,"isRitual":false},"Comprehend Languages":{"isConc":false,"isMem":false,"isRitual":true},"Detect Magic":{"isConc":true,"isMem":true,"isRitual":true},"Expeditious Retreat":{"isConc":true,"isMem":true,"isRitual":false},"Identify":{"isConc":false,"isMem":false,"isRitual":true},"Magic Missile":{"isConc":false,"isMem":true,"isRitual":false},"Shield":{"isConc":false,"isMem":false,"isRitual":false}},"spellFourth":{},"spellNinth":{},"spellSecond":{"Invisibility":{"isConc":true,"isMem":true,"isRitual":false},"Shatter":{"isConc":false,"isMem":false,"isRitual":false},"Spider Climb":{"isConc":true,"isMem":false,"isRitual":false},"Web":{"isConc":true,"isMem":true,"isRitual":false}},"spellSeventh":{},"spellSixth":{},"spellThird":{"Fireball":{"isConc":false,"isMem":true,"isRitual":false},"Haste":{"isConc":true,"isMem":true,"isRitual":false},"Leomund's Tiny Hut":{"isConc":false,"isMem":false,"isRitual":true}}}}};
            populateSheet();
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


//  ********** Arrange Details **********
    //  ***** Show Icons *****
$('#charInfoWrapper .sortIcon').on('click', function(){
    if(showMoveBtn) {showMoveBtn = false} else {showMoveBtn = true}
    populateSheet();
});

    //  ***** Move Detail - Up *****
$('#charInfoWrapper').on('click', '.moveUp', function(){
    const currKey = $(this).parent().children('.detailID').text();
    const currDetailName = $(this).parent().children('.row').text();
    const currDetailInfo = $(this).parent().children('.detailInfo').text();
    const nextKey = $(this).parent().prev().children('.detailID').text();
    const nextDetailName = $(this).parent().prev().children('.row').text();
    const nextDetailInfo = $(this).parent().prev().children('.detailInfo').text();
    console.log(currKey+": "+currDetailName+" - "+currDetailInfo);
    console.log(nextKey+": "+nextDetailName+" - "+nextDetailInfo);
    if (nextKey !== "") {
        currentCharacter.details[currKey] = {'detailInfo': nextDetailInfo, 'detailName': nextDetailName};
        currentCharacter.details[nextKey] = {'detailInfo': currDetailInfo, 'detailName': currDetailName};
        const update = {};
        update['details'] = currentCharacter.details;
        if (loggedIn) {dbCharRef.update(update)};
        populateSheet();
    }
});

    //  ***** Move Detail - Down *****
$('#charInfoWrapper').on('click', '.moveDown', function(){
    const currKey = $(this).parent().children('.detailID').text();
    const currDetailName = $(this).parent().children('.row').text();
    const currDetailInfo = $(this).parent().children('.detailInfo').text();
    const nextKey = $(this).parent().next().children('.detailID').text();
    const nextDetailName = $(this).parent().next().children('.row').text();
    const nextDetailInfo = $(this).parent().next().children('.detailInfo').text();
    console.log(currKey+": "+currDetailName+" - "+currDetailInfo);
    console.log(nextKey+": "+nextDetailName+" - "+nextDetailInfo);
    if (nextKey !== "") {
        currentCharacter.details[currKey] = {'detailInfo': nextDetailInfo, 'detailName': nextDetailName};
        currentCharacter.details[nextKey] = {'detailInfo': currDetailInfo, 'detailName': currDetailName};
        const update = {};
        update['details'] = currentCharacter.details;
        if (loggedIn) {dbCharRef.update(update)};
        populateSheet();
    }
});




//  ********** Settings Form **********
$('body').on('click', '.edit', function(){
    $('body').append(`  <section class="settingsBox">
                            <form class="scroll2">
                                <p class="px240">Title</p>
                                <section>
                                    <input type="text" id="newDetailTitle" class="px240">
                                </section>
                                <p class="px240">Details</p>
                                <section>
                                    <textarea id="newDetailInfo" rows="7" cols="40"></textarea>
                                </section>
                                <input type="submit" value="Update">
                                <button class="settingsCancel">Cancel</button>
                                <button class="settingsDelete">Remove</button>
                            </form>
                        </section>  `);
    const detailID = $(this).parent().parent().children('.detailID').text();
    const detailTitle1 = $(this).parent().text();
    const detailInfo1 = $(this).parent().parent().children('.detailInfo').text();
    $('#newDetailTitle').val(detailTitle1);
    $('#newDetailInfo').val(detailInfo1);
    $('.settingsBox input[type="submit"]').on('click', function(e){
        e.preventDefault();
        const detailTitle2 = $('#newDetailTitle').val();
        const detailInfo2 = $('#newDetailInfo').val();
        if ((detailTitle2 !== "" && detailInfo2 !== "") && (detailTitle2 !== detailTitle1 || detailInfo2 !== detailInfo1)) {
            currentCharacter.details[detailID] = {'detailInfo': detailInfo2, 'detailName': detailTitle2}
            const update = {};
            update['details'] = currentCharacter.details;
        if (loggedIn) {dbCharRef.update(update)};
        populateSheet();
        }
        $('.settingsBox').remove();
    });
    $('.settingsBox .settingsDelete').on('click', function(e){
        e.preventDefault();
        delete currentCharacter.details[detailID];
        const update = {};
        update['details.'+detailID] = firebase.firestore.FieldValue.delete();
        if (loggedIn) {dbCharRef.update(update)};
        populateSheet();
        $('.settingsBox').remove();
    });
});



//  ********** Settings Form **********
    //  ***** Settings Form - Cancel Button *****
$('body').on('click', '.settingsCancel', function(e){
    e.preventDefault();
    $('.settingsBox').remove();
});

//  ********** Settings Form - Click Settings Icon **********
$('body').on('click', '.settingsIcon', function(){
    $('.settingsBox').remove();
    $('body').append(`<section class="settingsBox"><form class="scroll2"></form></section>`);
    const settingsTitle = $(this).attr('title');
    let settingsHeader = `<h3>${settingsTitle}</h3>`

    //  ***** Character Settings *****
    if (settingsTitle === "Character Settings") {
        $('.settingsBox').prepend(settingsHeader);
        const settingsForm = `  <p class="px140">Name</p>
                                <input type="text" id="charNameEntry" class="px140">
                                <p class="px140">Race</p>
                                <input type="text" id="charRaceEntry" class="px140">
                                <p class="px140">Background</p>
                                <input type="text" id="charBgEntry" class="px140">
                                <p class="px140">Alignment</p>
                                <input type="text" id="charAlignmentEntry" class="px140">
                                <section>
                                    <p class="px90">Class</p>
                                    <p class="px55">Hit Die</p>
                                    <p class="px45">Level</p>
                                    <p class="px20"></p>
                                </section>
                                <section id="classLvlBreakout">

                                </section>
                                <button id="addNewClass">Add New Class</button>
                                <section>
                                    <p class="px60">Str</p>
                                    <p class="px60">Dex</p>
                                    <p class="px60">Con</p>
                                </section>
                                <section>
                                    <input type="number" id="strStat" class="px60">
                                    <input type="number" id="dexStat" class="px60">
                                    <input type="number" id="conStat" class="px60">
                                </section>
                                <section>
                                    <p class="px60">Int</p>
                                    <p class="px60">Wis</p>
                                    <p class="px60">Cha</p>
                                </section>
                                <section>
                                    <input type="number" id="intStat" class="px60">
                                    <input type="number" id="wisStat" class="px60">
                                    <input type="number" id="chaStat" class="px60">
                                </section>
                                <input type="submit" value="Update">
                                <button class="settingsCancel">Cancel</button>  `
        $('.settingsBox form').append(settingsForm);
        $.each(currentCharacter.charInfo.characterLevel, function(key, value){
            const classNum = $('#classLvlBreakout').children().length;
            const hdNum = currentCharacter.charInfo.characterLevel[key]['hd']
            let hitDie = "";
            if (hdNum === 3) {hitDie = "d12"} else if (hdNum === 2) {hitDie = "d10"} else if (hdNum === 1) {hitDie = "d8"} else {hitDie = "d6"}
            const levelSettings = ` <section>
                                        <label id="${classNum}Class" class="px90L">${key}</label>
                                        <label id="${classNum}HD" class="px55">${hitDie}</label>
                                        <input type="number" id="${classNum}Lvl" class="px45">
                                        <p class="px20"></p><img class="trash" src="img/trash.png" alt="Remove Class" title="Remove Class">
                                    </section>  `
            $('#classLvlBreakout').append(levelSettings);
            $(`#${classNum}Lvl`).val(currentCharacter.charInfo.characterLevel[key]['lvl']);
        });
        $('#charNameEntry').val(currentCharacter.charInfo.characterName);
        $('#charRaceEntry').val(currentCharacter.charInfo.characterRace);
        $('#charBgEntry').val(currentCharacter.charInfo.characterBackground);
        $('#charAlignmentEntry').val(currentCharacter.charInfo.characterAlignment);
        $('#strStat').val(currentCharacter.abilityScores.strScore);
        $('#dexStat').val(currentCharacter.abilityScores.dexScore);
        $('#conStat').val(currentCharacter.abilityScores.conScore);
        $('#intStat').val(currentCharacter.abilityScores.intScore);
        $('#wisStat').val(currentCharacter.abilityScores.wisScore);
        $('#chaStat').val(currentCharacter.abilityScores.chaScore);
        //  *** Add New Class Button ***
        $('.settingsBox').on('click', '#addNewClass', function(e){
            e.preventDefault();
            const classNum = $('#classLvlBreakout').children().length;
            const newClass = `  <section>
                                    <input type="text" id="${classNum}Class" class="px90L"></input>
                                    <select id="${classNum}HD" class="px55">
                                        <option value=0>d6</option>
                                        <option value=1>d8</option>
                                        <option value=2>d10</option>
                                        <option value=3>d12</option>
                                    </select>
                                    <input type="number" id="${classNum}Lvl" class="px45">
                                    <p class="px20"></p><img class="trash" src="img/trash.png" alt="Remove Class" title="Remove Class">
                                </section>  `
            $('#classLvlBreakout').append(newClass);
        });
        //  *** Remove Class Button ***
        $('.settingsBox').on('click', '.trash', function(){
            let className = ""
                if ($(this).parent().children('.px90L').is('input')) {
                    className = $(this).parent().children('.px90L').val()
                } else {
                    className = $(this).parent().children('.px90L').text()
                }
            if(className !== "") {
                delete currentCharacter.charInfo.characterLevel[className];
                const update = {};
                update['charInfo.characterLevel.'+className] = firebase.firestore.FieldValue.delete();
                if (loggedIn) {dbCharRef.update(update)};
            }
            populateSheet();
            $(this).parent().remove();
        });
        //  *** Submit Character Settings ***
        $('.settingsBox input[type="submit"]').on('click', function(e){
            e.preventDefault();
            const saveSnapshotScores = JSON.stringify(currentCharacter.abilityScores);
            const saveSnapshotCharInfo = JSON.stringify(currentCharacter.charInfo);
            currentCharacter.charInfo.characterName = $('#charNameEntry').val();
            currentCharacter.charInfo.characterRace = $('#charRaceEntry').val();
            currentCharacter.charInfo.characterBackground = $('#charBgEntry').val();
            currentCharacter.charInfo.characterAlignment = $('#charAlignmentEntry').val();
            currentCharacter.abilityScores.strScore = parseInt($('#strStat').val());
            currentCharacter.abilityScores.dexScore = parseInt($('#dexStat').val());
            currentCharacter.abilityScores.conScore = parseInt($('#conStat').val());
            currentCharacter.abilityScores.intScore = parseInt($('#intStat').val());
            currentCharacter.abilityScores.wisScore = parseInt($('#wisStat').val());
            currentCharacter.abilityScores.chaScore = parseInt($('#chaStat').val());
            $('#classLvlBreakout').children().each(function(i){
                let className = ""
                if ($(this).children('.px90L').is('input')) {
                    className = $(this).children('.px90L').val()
                } else {
                    className = $(this).children('.px90L').text()
                }
                className = className.replace(/[^a-zA-Z ]/g, "")
                let classHD = ""
                if ($(this).children('.px55').is('input')) {
                    classHD = $(this).children('.px55').val()
                } else {
                    classHD = $(this).children('.px55').text()
                }
                if (classHD === "d12") {classHD = 3} else if (classHD === "d10") {classHD = 2} else if (classHD === "d8") {classHD = 1} else {classHD = 0};
                let classLvl = parseInt($(this).children('.px45').val());
                if (classLvl < 1) {classLvl = ""}
                if(className !== "" && classLvl !== "") {
                    currentCharacter.charInfo.characterLevel[className] = {'lvl': classLvl, 'hd': classHD};
                };
            });
            const isEqualScores = saveSnapshotScores === JSON.stringify (currentCharacter.abilityScores);
            const isEqualCharInfo = saveSnapshotCharInfo === JSON.stringify (currentCharacter.charInfo);
            const update = {};
            if (!(isEqualScores)) {update['abilityScores'] = currentCharacter.abilityScores};
            if (!(isEqualCharInfo)) {update['charInfo'] = currentCharacter.charInfo};
            if (loggedIn && (!(isEqualScores) || !(isEqualCharInfo))) {dbCharRef.update(update)};
            populateSheet();
            $('.settingsBox').remove();
        });
    }


    //  ***** Saving Throw Settings *****
    if (settingsTitle === "Saving Throw Settings") {
        settingsHeader += `<div><p class="px90">Ability</p><p class="px80">Proficiency</p><p class="px45">Bonus</p></div>`
        $('.settingsBox').prepend(settingsHeader);
        const settingsForm = `  <section>
                                <label class="px90L">Strength</label>
                                <input type="checkbox" id="strSaveProf" class="settingsCheckbox">
                                <label for="strSaveProf" class="px80">Proficient</label>
                                <input type="number" id="strSaveMod" class="px45">
                            </section>
                            <section>
                                <label class="px90L">Dexterity</label>
                                <input type="checkbox" id="dexSaveProf" class="settingsCheckbox">
                                <label for="dexSaveProf" class="px80">Proficient</label>
                                <input type="number" id="dexSaveMod" class="px45">
                            </section>
                            <section>
                                <label class="px90L">Constitution</label>
                                <input type="checkbox" id="conSaveProf" class="settingsCheckbox">
                                <label for="conSaveProf" class="px80">Proficient</label>
                                <input type="number" id="conSaveMod" class="px45">
                            </section>
                            <section>
                                <label class="px90L">Intelligence</label>
                                <input type="checkbox" id="intSaveProf" class="settingsCheckbox">
                                <label for="intSaveProf" class="px80">Proficient</label>
                                <input type="number" id="intSaveMod" class="px45">
                            </section>
                            <section>
                                <label class="px90L">Wisdom</label>
                                <input type="checkbox" id="wisSaveProf" class="settingsCheckbox">
                                <label for="wisSaveProf" class="px80">Proficient</label>
                                <input type="number" id="wisSaveMod" class="px45">
                            </section>
                            <section>
                                <label class="px90L">Charisma</label>
                                <input type="checkbox" id="chaSaveProf" class="settingsCheckbox">
                                <label for="chaSaveProf" class="px80">Proficient</label>
                                <input type="number" id="chaSaveMod" class="px45">
                            </section>
                            <section>
                                <label for="addToSaves" class="px90">Add to Saves:</label>
                                <select id="addToSaves" class="px120">
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
                            <button class="settingsCancel">Cancel</button>  `
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
        //  *** Submit Saving Throw Settings ***
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
            if (loggedIn && !(isEqual)) {dbCharRef.update(update)};
            populateSheet();
            $('.settingsBox').remove();
        });
    }


    //  ***** Skill Settings *****
    if (settingsTitle === "Skills/Tools Settings") {
        $('.settingsBox').prepend(settingsHeader);
        const settingsForm = `  <div>
                                    <p class="px120"></p>
                                    <p class="px80" title="Miscellaneous ability bonus to be added to Passive Perception">Misc Ability</p>
                                    <p class="px45" title="Miscellaneous bonus to be added to Passive Perception">Misc</p>
                                </div>
                                <section id="passivePerceptionSettings">
                                    <label class="px120">Passive Perception</label>
                                    <select id="passivePerceptionMiscAbility" class="px80">
                                        <option value=6>None</option>
                                        <option value=4>STR</option>
                                        <option value=2>DEX</option>
                                        <option value=1>CON</option>
                                        <option value=3>INT</option>
                                        <option value=5>WIS</option>
                                        <option value=0>CHA</option>
                                    </select>
                                    <input type="number" id="passivePerceptionMisc" class="px45">
                                </section>
                                <section>
                                    <label class="px140">Change Skill Defaults</label>
                                    <input type="checkbox" id="changeDefault" class="settingsCheckbox">
                                    <label for="changeDefault" class="px45">Edit</label>
                                </section>
                                <div>
                                    <p class="px45">Prof</p>
                                    <p class="px100">Skill/Tool</p>
                                    <p class="px55">Ability</p>
                                    <p class="px40">Misc</p>
                                    <p class="px20"></p>
                                </div>
                                <section id="skillItems">

                                </section>
                                <section>
                                    <button id="addSkill">New Skill/Tool</button>
                                </section>
                                <input type="submit" value="Update">
                                <button class="settingsCancel">Cancel</button>  `
        $('.settingsBox form').append(settingsForm);
        $.each(currentCharacter.skills, function(key, value){
            const modKey = key.replace(/ /g,"_").replace(/'/g,"").replace(/"/g,"");
            const cSkills = currentCharacter.skills;
            const proficiency = cSkills[key]['prof'];
            const abilityScore = cSkills[key]['score'];
            const miscBonus = cSkills[key]['misc'];
            let stdSkill = ""
            let trash = `<img class="trash" src="img/trash.png" alt="Remove Skill" title="Remove Skill"></img>`
            if (stdSkills.indexOf(key) !== -1) {
                stdSkill = ` stdSkill"`;
                trash = "";
            }
            const skillEntry = `<section>
                                    <select id="${modKey}Prof" class="px45">
                                        <option value=0> - </option>
                                        <option value=0.5>1/2</option>
                                        <option value=1>x1</option>
                                        <option value=2>x2</option>
                                    </select>
                                    <label class="px100">${key}</label>
                                    <select id="${modKey}Score" class="px55${stdSkill}">
                                        <option value=6>None</option>
                                        <option value=4>STR</option>
                                        <option value=2>DEX</option>
                                        <option value=1>CON</option>
                                        <option value=3>INT</option>
                                        <option value=5>WIS</option>
                                        <option value=0>CHA</option>
                                    </select>
                                    <input type="number" id="${modKey}Misc" class="px40">
                                    <p class="px20"></p>${trash}
                                </section>  `
        $('#skillItems').append(skillEntry);
        $(`#${modKey}Prof`).val(proficiency);
        $(`#${modKey}Score`).val(abilityScore);
        $(`#${modKey}Misc`).val(miscBonus);
        });
        $('#passivePerceptionMiscAbility').val(currentCharacter.misc.passivePerceptionBonus.miscScore);
        $('#passivePerceptionMisc').val(currentCharacter.misc.passivePerceptionBonus.misc);
        $('.stdSkill').prop('disabled', true)
        //  *** Edit Standard Skills ***
        $('#changeDefault').change(function(){
            if ($(this).is(":checked")) {$('.stdSkill').prop('disabled', false)} else {$('.stdSkill').prop('disabled', true)}
        });
        //  *** Add New Skill ***
        $('#addSkill').on('click', function(e){
            e.preventDefault();
            const length = $('#skillItems').children().length;
            const skillEntry = `<section>
                                    <select id="${length}Prof" class="px45">
                                        <option value=0> - </option>
                                        <option value=0.5>1/2</option>
                                        <option value=1>x1</option>
                                        <option value=2>x2</option>
                                    </select>
                                    <input type="text" id="${length}Key" class="px100">
                                    <select id="${length}Score" class="px55">
                                        <option value=6>None</option>
                                        <option value=4>STR</option>
                                        <option value=2>DEX</option>
                                        <option value=1>CON</option>
                                        <option value=3>INT</option>
                                        <option value=5>WIS</option>
                                        <option value=0>CHA</option>
                                    </select>
                                    <input type="number" id="${length}Misc" class="px40">
                                    <p class="px20"></p>
                                </section>  `
            $('#skillItems').append(skillEntry);
        });
        //  *** Remove Custom Skill ***
        $('.settingsBox').on('click', '.trash', function(){
            const key = $(this).parent().children('label').text();
            delete currentCharacter.skills[key];
            const update = {};
            update['skills.'+key] = firebase.firestore.FieldValue.delete();
            if (loggedIn) {dbCharRef.update(update)};
            $(this).parent().remove();
            populateSheet();
        });
        //  *** Update Skills ***
        $('.settingsBox input[type="submit"]').on('click', function(e){
            e.preventDefault();
            const saveSnapshotPassivePerception = JSON.stringify(currentCharacter.misc.passivePerceptionBonus);
            const saveSnapshotSkills = JSON.stringify(currentCharacter.skills);
            currentCharacter.misc.passivePerceptionBonus.miscScore = parseInt($('#passivePerceptionMiscAbility').val());
            currentCharacter.misc.passivePerceptionBonus.misc = parseInt($('#passivePerceptionMisc').val());
            $(skillItems).children().each(function(){
                let key = ""
                if ($(this).children('.px100').is('input')) {
                    key = $(this).children('.px100').val();
                    key = key.replace(/[^a-zA-Z0-9 '-]/g, "");
                } else {
                    key = $(this).children('.px100').text();
                }
                const prof = parseFloat($(this).children('.px45').val());
                const score = parseInt($(this).children('.px55').val());
                let misc = parseInt($(this).children('.px40').val());
                if (isNaN(misc)) {misc = 0};
                if (key !== "") {currentCharacter.skills[key] = {'misc': misc, 'prof': prof, 'score': score}};
            });
            const isEqualPassivePerception = saveSnapshotPassivePerception === JSON.stringify (currentCharacter.misc.passivePerceptionBonus);
            const isEqualSkills = saveSnapshotSkills === JSON.stringify(currentCharacter.skills);
            const update = {};
            if (!(isEqualPassivePerception)) {update['misc.passivePerceptionBonus'] = currentCharacter.misc.passivePerceptionBonus};
            if (!(isEqualSkills)) {update['skills'] = currentCharacter.skills};
            if (loggedIn && (!(isEqualSkills) || !(isEqualPassivePerception))) {dbCharRef.update(update)};
            populateSheet();
            $('.settingsBox').remove();
        });
    }


    //  ***** Attacks Menu *****
    if (settingsTitle === "Add New Info") {
        $('.settingsBox').prepend(settingsHeader);
        const settingsForm =   `<p class="px240">Title</p>
                                <section><input type="text" id="newDetailTitle" class="px240"></section>
                                <p class="px240">Details</p>
                                <section><textarea id="newDetailInfo" rows="7" cols="40"></textarea></section>
                                <input type="submit" value="Add Detail">
                                <button class="settingsCancel">Cancel</button>  `
        $('.settingsBox form').append(settingsForm);



    }


    //  ***** Add Character Detail *****
    if (settingsTitle === "Add New Info") {
        $('.settingsBox').prepend(settingsHeader);
        const settingsForm =   `<p class="px240">Title</p>
                                <section><input type="text" id="newDetailTitle" class="px240"></section>
                                <p class="px240">Details</p>
                                <section><textarea id="newDetailInfo" rows="7" cols="40"></textarea></section>
                                <input type="submit" value="Add Detail">
                                <button class="settingsCancel">Cancel</button>  `
        $('.settingsBox form').append(settingsForm);
        //  *** Submit Character Detail
        $('.settingsBox input[type="submit"]').on('click', function(e){
            e.preventDefault();
            const timestamp = $.now();
            const detailTitle = $('#newDetailTitle').val();
            const detailInfo = $('#newDetailInfo').val();
            if (detailInfo !== "" && detailTitle !== "") {
                currentCharacter.details[timestamp] = {'detailInfo': detailInfo, 'detailName': detailTitle}
                const update = {};
                update['details'] = currentCharacter.details;
            if (loggedIn) {dbCharRef.update(update)};
            populateSheet();
            }
            $('.settingsBox').remove();
        });
    }


    //  ***** Spell Settings *****
    if (settingsTitle === "Spell Settings") {
        $('.settingsBox').prepend(settingsHeader);
        const settingsForm = `      <div>
                                        <p class="px100">Casting Ability</p>
                                        <p class="px60">Atk Mod</p>
                                        <p class="px60">DC Mod</p>
                                    </div>
                                    <section>
                                    <select id="spellAbility" class="px100">
                                        <option value=6>None</option>
                                        <option value=4>Strength</option>
                                        <option value=2>Dexterity</option>
                                        <option value=1>Constitution</option>
                                        <option value=3>Intelligence</option>
                                        <option value=5>Wisdom</option>
                                        <option value=0>Charisma</option>
                                    </select>
                                    <input type="number" id="spellAtk" class="px60">
                                    <input type="number" id="spellDC" class="px60">
                                </section>
                                <h3>Spells Per Rest</h3>
                                <div>
                                    <p class="px80">Spell Level</p>
                                    <p class="px45">Long-Rest</p>
                                    <p class="px45">Short-Rest</p>
                                </div>
                                <section>
                                    <label class="px80">1st Level</label>
                                    <input type="number" id="spellFirstPLR" class="px45">
                                    <input type="number" id="spellFirstPSR" class="px45">
                                </section>
                                <section>
                                    <label class="px80">2nd Level</label>
                                    <input type="number" id="spellSecondPLR" class="px45">
                                    <input type="number" id="spellSecondPSR" class="px45">
                                </section>
                                <section>
                                    <label class="px80">3rd Level</label>
                                    <input type="number" id="spellThirdPLR" class="px45">
                                    <input type="number" id="spellThirdPSR" class="px45">
                                </section>
                                <section>
                                    <label class="px80">4th Level</label>
                                    <input type="number" id="spellFourthPLR" class="px45">
                                    <input type="number" id="spellFourthPSR" class="px45">
                                </section>
                                <section>
                                    <label class="px80">5th Level</label>
                                    <input type="number" id="spellFifthPLR" class="px45">
                                    <input type="number" id="spellFifthPSR" class="px45">
                                </section>
                                <section>
                                    <label class="px80">6th Level</label>
                                    <input type="number" id="spellSixthPLR" class="px45">
                                    <input type="number" id="spellSixthPSR" class="px45">
                                </section>
                                <section>
                                    <label class="px80">7th Level</label>
                                    <input type="number" id="spellSeventhPLR" class="px45">
                                    <input type="number" id="spellSeventhPSR" class="px45">
                                </section>
                                <section>
                                    <label class="px80">8th Level</label>
                                    <input type="number" id="spellEighthPLR" class="px45">
                                    <input type="number" id="spellEighthPSR" class="px45">
                                </section>
                                <section>
                                    <label class="px80">9th Level</label>
                                    <input type="number" id="spellNinthPLR" class="px45">
                                    <input type="number" id="spellNinthPSR" class="px45">
                                </section>
                                <input type="submit" value="Update">
                                <button class="settingsCancel">Cancel</button>  `
        $('.settingsBox form').append(settingsForm);
        $('#spellAbility').val(currentCharacter.spells.spellStats.score);
        $('#spellAtk').val(currentCharacter.spells.spellStats.atkMod);
        $('#spellDC').val(currentCharacter.spells.spellStats.dcMod);
        $('#spellFirstPLR').val(currentCharacter.spells.spellCasts.spellFirstCasts.lrTotal);
        $('#spellSecondPLR').val(currentCharacter.spells.spellCasts.spellSecondCasts.lrTotal);
        $('#spellThirdPLR').val(currentCharacter.spells.spellCasts.spellThirdCasts.lrTotal);
        $('#spellFourthPLR').val(currentCharacter.spells.spellCasts.spellFourthCasts.lrTotal);
        $('#spellFifthPLR').val(currentCharacter.spells.spellCasts.spellFifthCasts.lrTotal);
        $('#spellSixthPLR').val(currentCharacter.spells.spellCasts.spellSixthCasts.lrTotal);
        $('#spellSeventhPLR').val(currentCharacter.spells.spellCasts.spellSeventhCasts.lrTotal);
        $('#spellEighthPLR').val(currentCharacter.spells.spellCasts.spellEighthCasts.lrTotal);
        $('#spellNinthPLR').val(currentCharacter.spells.spellCasts.spellNinthCasts.lrTotal);
        $('#spellFirstPSR').val(currentCharacter.spells.spellCasts.spellFirstCasts.srTotal);
        $('#spellSecondPSR').val(currentCharacter.spells.spellCasts.spellSecondCasts.srTotal);
        $('#spellThirdPSR').val(currentCharacter.spells.spellCasts.spellThirdCasts.srTotal);
        $('#spellFourthPSR').val(currentCharacter.spells.spellCasts.spellFourthCasts.srTotal);
        $('#spellFifthPSR').val(currentCharacter.spells.spellCasts.spellFifthCasts.srTotal);
        $('#spellSixthPSR').val(currentCharacter.spells.spellCasts.spellSixthCasts.srTotal);
        $('#spellSeventhPSR').val(currentCharacter.spells.spellCasts.spellSeventhCasts.srTotal);
        $('#spellEighthPSR').val(currentCharacter.spells.spellCasts.spellEighthCasts.srTotal);
        $('#spellNinthPSR').val(currentCharacter.spells.spellCasts.spellNinthCasts.srTotal);
        //  *** Submit Spell Settings ***
        $('.settingsBox input[type="submit"]').on('click', function(e){
            e.preventDefault();
            const saveSnapshot = JSON.stringify(currentCharacter.spells);
            currentCharacter.spells.spellStats.score = parseInt($('#spellAbility').val());
            currentCharacter.spells.spellStats.atkMod = parseInt($('#spellAtk').val());
            currentCharacter.spells.spellStats.dcMod = parseInt($('#spellDC').val());
            currentCharacter.spells.spellCasts.spellFirstCasts.lrTotal = parseInt($('#spellFirstPLR').val());
            currentCharacter.spells.spellCasts.spellSecondCasts.lrTotal = parseInt($('#spellSecondPLR').val());
            currentCharacter.spells.spellCasts.spellThirdCasts.lrTotal = parseInt($('#spellThirdPLR').val());
            currentCharacter.spells.spellCasts.spellFourthCasts.lrTotal = parseInt($('#spellFourthPLR').val());
            currentCharacter.spells.spellCasts.spellFifthCasts.lrTotal = parseInt($('#spellFifthPLR').val());
            currentCharacter.spells.spellCasts.spellSixthCasts.lrTotal = parseInt($('#spellSixthPLR').val());
            currentCharacter.spells.spellCasts.spellSeventhCasts.lrTotal = parseInt($('#spellSeventhPLR').val());
            currentCharacter.spells.spellCasts.spellEighthCasts.lrTotal = parseInt($('#spellEighthPLR').val());
            currentCharacter.spells.spellCasts.spellNinthCasts.lrTotal = parseInt($('#spellNinthPLR').val());
            currentCharacter.spells.spellCasts.spellFirstCasts.srTotal = parseInt($('#spellFirstPSR').val());
            currentCharacter.spells.spellCasts.spellSecondCasts.srTotal = parseInt($('#spellSecondPSR').val());
            currentCharacter.spells.spellCasts.spellThirdCasts.srTotal = parseInt($('#spellThirdPSR').val());
            currentCharacter.spells.spellCasts.spellFourthCasts.srTotal = parseInt($('#spellFourthPSR').val());
            currentCharacter.spells.spellCasts.spellFifthCasts.srTotal = parseInt($('#spellFifthPSR').val());
            currentCharacter.spells.spellCasts.spellSixthCasts.srTotal = parseInt($('#spellSixthPSR').val());
            currentCharacter.spells.spellCasts.spellSeventhCasts.srTotal = parseInt($('#spellSeventhPSR').val());
            currentCharacter.spells.spellCasts.spellEighthCasts.srTotal = parseInt($('#spellEighthPSR').val());
            currentCharacter.spells.spellCasts.spellNinthCasts.srTotal = parseInt($('#spellNinthPSR').val());
            const isEqual = saveSnapshot === JSON.stringify (currentCharacter.spells);
            const update = {};
            update['spells.spellCasts'] = currentCharacter.spells.spellCasts;
            update['spells.spellStats'] = currentCharacter.spells.spellStats;
            if (loggedIn && !(isEqual)) {dbCharRef.update(update)};
            populateSheet();
            $('.settingsBox').remove();
        });
    }
});

//  ********** Settings Form - Cancel Button **********
$('body').on('click', '.settingsCancel', function(e){
    e.preventDefault();
    $('.settingsBox').remove();
});
//  ********** END Settings Form **********


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
    const qtyForm = `   <form class="sectWrapper" id="qtyForm">
                            <h3>${itemName}</h3>
                            <input type="number" id="newQty" class="">
                            <input type="image" class="checkmark" name="submit" src="img/checkmark.png" alt="Submit" title="Submit">
                            <img class="cancel" src="img/xmark.png" alt="Cancel" title="Cancel">
                            <img class="trash" src="img/trash.png" alt="Remove Item" title="Remove Item">
                        </form> `
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
        //  ***** Cast/Restore Spell *****
            //  *** Generate Castbox
$('#spellList').on('click', 'div', function(){
    const spellLvl = $(this).attr('id');
    const castBox = `   <section class="sectWrapper" id="castSpell">
                            <h5 class="useSpell">Use Spell Slot</h5>
                            <h5 class="restoreSpell">Restore Spell Slot</h5>
                        </section> `
    $(this).append(castBox);
});
            //  *** Generate Castbox
$('#spellList').on('click', 'h5', function(){
    const spellLvl = $(this).parent().parent().attr('id');
    let lrRemain = currentCharacter.spells.spellCasts[spellLvl]['lrRemain'];
    let srRemain = currentCharacter.spells.spellCasts[spellLvl]['srRemain'];
    const lrTotal =  currentCharacter.spells.spellCasts[spellLvl]['lrTotal'];
    const srTotal = currentCharacter.spells.spellCasts[spellLvl]['srTotal'];
    const spellCheck = JSON.stringify(currentCharacter.spells.spellCasts[spellLvl]);
    if ($(this).hasClass('useSpell')) {
        if ((lrRemain + srRemain) > 0) {
            if(srRemain > 0) {srRemain -= 1} else {lrRemain -= 1};
        }
    } else {
        if ((lrRemain + srRemain) < (lrTotal + srTotal)) {
            if(lrRemain < lrTotal) {lrRemain += 1} else {srRemain += 1};
        }
    }
    currentCharacter.spells.spellCasts[spellLvl]['lrRemain'] = lrRemain;
    currentCharacter.spells.spellCasts[spellLvl]['srRemain'] = srRemain;
    currentCharacter.spells.spellCasts[spellLvl]['lrTotal'] = lrTotal;
    currentCharacter.spells.spellCasts[spellLvl]['srTotal'] = srTotal;
    const castCheck = JSON.stringify(currentCharacter.spells.spellCasts[spellLvl]) === spellCheck
    const update = {}
    update['spells.spellCasts.'+spellLvl] = currentCharacter.spells.spellCasts[spellLvl];
    if (loggedIn && !(castCheck)) {dbCharRef.update(update)};
    populateSheet();
});
//  ********** END Spell Management **********


//  ********** On Click Hooks **********
$(document).mouseup(function(e){
    //  Change Quantity - Remove Qty Changer Element on Focus Out
    if (!$('#qtyForm').is(e.target) && $('#qtyForm').has(e.target).length === 0) {
        $('#qtyForm').remove();
    };
    //  Settings Form - Remove Element on Focus Out
    if (!$('.settingsBox').is(e.target) && $('.settingsBox').has(e.target).length === 0) {
        $('.settingsBox').remove();
    };
    if (!$('#castSpell').is(e.target) && $('#castSpell').has(e.target).length === 0) {
        $('#castSpell').remove();
    };
});