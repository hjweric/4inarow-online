var b,bp,wp,user_color,m,num_games,num_practice_games, current_color, gi,mi, current_move, player_save,gi_save,mi_save, steps, move_left
var total_steps, level
var tiles = [];
var game_status = "ready"
//game_status = "ready";
//move_index = 0;
//last_move = 99;
var M=9,N=4
var win_color = "#22ddaa",
    square_color = "#999999",
    highlight_color = "#bbbbbb";
var data_log =[]
var start_category = 1
var dismissed_click_prompt = false;
var lastresult = "win"
var task_type
var game_data = {}


function load_game_data(filename){
    $.getJSON(filename, function(response) {
        start_experiment(response)
    });
}


function load_game_start(game_num){
    bp_start = game_data[task_type][game_num][0][1]
    wp_start = game_data[task_type][game_num][0][2]
    log_data({"started":true, "bs":bp_start,"ws":wp_start})
    create_board()
    for(var i=0; i<M*N; i++){
        if(bp_start[i]==1){
            add_piece(i, 0);
        }
        if(wp_start[i]==1){
            add_piece(i, 1);
        }
    }

}


function reconstruction_all(game_num){
    game_data["formal"] = shuffle(game_data["formal"])

    load_game_start(game_num)
    mi = 0
    steps = game_data[task_type][game_num].length
    $('.headertext h1').text('This game has ' + steps.toString() + ' moves').css('color', '#000000');

    log_data({"steps":steps, "bs":bp_start,"ws":wp_start})

    timer = setTimeout(function(){
        play_next_move(game_num)
    }, 5000)

}


function play_next_move(game_num){
    if (mi< steps){
        var data = game_data[task_type][game_num][mi]
        move = data[3]
        color = data[0]
        add_piece(move,color);
        show_last_move(move, color);
        log_data({"event_type": "one move played", "event_info" : {"move_color" : color, "move_index" : move,"bp" : bp.join(""), "wp": wp.join(""), "game_num": game_num}})

        mi++
        timer = setTimeout(
            function(){
                play_next_move(game_num)},3000);
    }
    else{
        //add_piece(move,color);
        //show_last_move(move, color);
        total_steps = bp.filter(x => x==1).length + wp.filter(x => x==1).length
        create_board()
        timer = setTimeout(function (){
            load_game_start(game_num)
            user_move(game_num)
        },5000)
    }
}

function get_level_game(){
    if (game_data[player][gi][0]>1000){
        return game_data[player][gi][0][4]
    }
    else {return  game_data[player][gi][1][4]}
}



function select_random_board(game_num) {
    generate_ok_games()
    $('.headertext h1').text('This game has ' + steps.toString() + ' moves').css('color', '#000000');
    timer = setTimeout(function (){
        play_next_move(game_num)
    },5000)
}

function create_board() {
    bp = new Array(M*N).fill(0)
    wp = new Array(M*N).fill(0)
    $(".canvas").empty();
    for (var i=0; i<N; i++) {
        for(var j=0; j<M; j++) {
            $(".canvas").append($("<div>", {"class" : "tile", "id": "tile_" + (i*M + j).toString()}))
        }
        $(".canvas").append("<br>");
    }
}

function add_piece(i, color) {
    if(color == 0) {//BLACK
        $("#tile_" + i.toString()).append(
            $("<div>",{"class" : "blackPiece"})
        ).removeClass("tile").addClass("usedTile").off('mouseenter').off('mouseleave').css("backgroundColor", square_color);
        bp[i] = 1;
    } else {
        $("#tile_" + i.toString()).append(
            $("<div>",{"class" : "whitePiece"})
        ).removeClass("tile").addClass("usedTile").off('mouseenter').off('mouseleave').css("backgroundColor", square_color);
        wp[i] = 1;
    }
}

function remove_piece(i){
    $("#tile_" + i.toString()).empty().removeClass("usedTile").addClass("tile").off().css("backgroundColor", square_color);
    bp[i]=0
    wp[i]=0
}


function show_last_move(i, color) {
    if(color == 0) {//BLACK
        $(".blackShadow").remove();
        $("#tile_" + i.toString()).append($("<div>" , {"class" : "blackShadow"}))
    } else {
        $(".whiteShadow").remove();
        $("#tile_" + i.toString()).append($("<div>" , {"class" : "whiteShadow"}))
    }
}


function user_move(game_num) {
    if (bp.filter(x => x==1).length == wp.filter(x => x==1).length){
        current_color = 0}
    else {current_color = 1}
    color_string = (current_color == 0 ? 'black' : 'white')
    steps_string = steps.toString()
    log_data({"event_type": "your turn", "event_info" : {"bp" : bp.join(""), "wp": wp.join(""), "user_color" : color_string, "game_num": game_num}})
    $('.headertext h1').text('You now play ' + color_string + ". " + steps_string +" moves left.");
    $('.canvas, .tile').css('cursor', 'pointer');
    $('.usedTile, .usedTile div').css('cursor', 'default');
    $('.tile').off().on('mouseenter', function(e){
        $(e.target).animate({"background-color":highlight_color}, 50)
    }).on('mouseleave', function(e){
        $(e.target).animate({"background-color": square_color}, 50)
    });
    $('.tile').off('click').on('click', function(e){
        $('.tile').off('mouseenter').off('mouseleave').off('click');
        $('.canvas, .canvas div').css('cursor', 'default');
        tile_ind = parseInt(e.target.id.replace("tile_", ""));
        log_data({"event_type": "user move", "event_info" : {"tile" : tile_ind, "bp" : bp.join(""), "wp": wp.join(""), "user_color" : color_string,  "game_num": game_num}})
        add_piece(tile_ind,current_color);
        show_last_move(tile_ind, current_color);
        $(".clickprompt").hide();
        dismissed_click_prompt = true;
        //winning_pieces = check_win(user_color)    // DON'T WANT TO SHOW WIN ANY POINT IN THE GAME
        if (bp.filter(x => x==1).length + wp.filter(x => x==1).length == total_steps){
            //show_win(current_color,winning_pieces)
            log_data({"event_type": "reconstruction over", "event_info" : {"bp" : bp.join(""), "wp": wp.join(""), "game_num":game_num}})
            $('.headertext h1').text('Reconstruction over').css('color', '#000000');
            end_game(game_num)
        }
        else {
            steps--
            user_move(game_num)
        }
    });
}

function check_all_reconstructed(total_steps){
    return bp.filter(x => x==1).length + wp.filter(x => x==1).length == total_steps;
}
function start_game(game_num){
    log_data({"event_type": "start game", "event_info" : {"game_num" : game_num}})
    if(game_num<num_practice_games){
        task_type = 'practice'
        $('.gamecount').text("Practice game " + (game_num+1).toString() + " out of " + num_practice_games.toString());
    }
    else{
        task_type = "formal"
        $('.gamecount').text("Game " + (game_num-num_practice_games+1).toString() + " out of " + num_games.toString());
    }
    reconstruction_all(game_num)
    if (!dismissed_click_prompt) $('.clickprompt').show();
    log_data({"event_type": "start game", "event_info": {"game_num": game_num, "is_practice": game_num<num_practice_games,"user_color" : (user_color == 0 ? 'black' : 'white')}})
}


function end_game(game_num){
    log_data({"event_type": "end game", "event_info" : {"game_num" : game_num, "level" : level}})
    //adjust_level(result)
    $("#nextgamebutton").show().css({"display" :"inline"}).off("click").on("click",function(){
        $("#nextgamebutton").hide()
        $(".canvas").empty();
        if(game_num == num_practice_games + num_games-1){
            finish_experiment()
        }
        else if (game_num == num_practice_games -1){
            show_instructions(0,instructions_text_after_practice,instructions_urls_after_practice,function(){
                start_game(game_num+1)
            },"Start")
        }
        else{
            start_game(game_num+1)
        }
    })
}


function goFullscreen() {
    let element = document.body;
    let requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

    if (requestMethod) { // Native full screen.
        requestMethod.call(element);
    } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
}

function show_instructions(i,texts,urls,callback,start_text){
    log_data({"event_type": "show instructions", "event_info" : {"screen_number": i}})
    category = start_category
    goFullscreen()
    $('.overlayed').show();
    $('#instructions').show();
    $('#instructions p').remove();
    $('#instructions h4').after("<p>" + texts[i] + "</p>");
    if(urls[i]==""){
        $('#instructions img').hide()
    }
    else{
        $('#instructions img').show().attr("src",get_image_path(urls[i] + ".png"));
    }
    if(i==0){
        $('#previousbutton').hide()
    }
    else {
        $('#previousbutton').show().off("click").on("click",function(){
            show_instructions(i-1,texts,urls,callback,start_text);
        });
    }
    if(i == texts.length - 1 || i == urls.length - 1){
        $('#nextbutton').text(start_text)
        $('#nextbutton').off("click").on("click",function(){
            $('#instructions').hide();
            $('.overlayed').hide();
            callback();
        })
    }
    else {
        $('#nextbutton').text("Next")
        $('#nextbutton').off("click").on("click",function(){
            show_instructions(i+1,texts,urls,callback,start_text);
        });
    }
}

function initialize_task(_num_games,_num_practice_games,callback){
    num_games = _num_games
    num_practice_games = _num_practice_games
    user_color = 0
    instructions_text = ["You will be seeing black and white circles appearing on a board, alternately, and your task is to remember the order and location in which the circles occur",
        "There will be circles on the initial screen, and you can watch it for 5 seconds",
        "Then, you will see 4 to 10 circles appear on the screen, one at a time. The first circle you see will always be a black circle",
        "click next to see the next move",
        "click next to see the next move",
        "click next to see the next move",
        "After seeing the circles, you will see a blank board for 5 seconds",
        "Then the initial circles will show up again.",
        "Your task is to recreate the 4-10 circles that you saw on the screen, in the order and location they appeared, by clicking on the location where you think they occurred the board",
        "You cannot control when to see the next moves in the games in the future",
        "You will now play " + _num_practice_games.toString() + " practice games. Click start to begin."
    ]

    instructions_urls = ["",
        "initial",
        "m1",
        "m2",
        "m3",
        "m4",
        "empty",
        "initial",
        "" +
        "" +
        "" ]
    instructions_text_after_practice = ["You will now play " + num_games.toString() + " games"]
    instructions_urls_after_practice = [""]


    instructions_text_finished = ["Thank you for playing!"]

    instructions_urls_finished = [""]
    callback()
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}
function getRndEorONumber(min,max, eo){
    var rand = getRndInteger(min,max)
    log_data({"number": rand})
    if ((rand%2 == eo)){return rand}
    else if (rand<max) {return rand+1}
    else {return rand-1}
}


function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


function start_experiment(response){
    game_data=response
    // start_color = Math.round(Math.random())
    // log_data({"start_color": start_color})
    makemove = Module.cwrap('makemove', 'number', ['number','string','string','number','number'])
    $(document).on("contextmenu",function(e){
        e.preventDefault()
    })
    show_instructions(0,instructions_text,instructions_urls,function(){
        start_game(0)
    },"Start")
}

