var b,bp,wp,user_color,m
var tiles = [];
var preloadedImages = [];
var game_status = "ready"
//game_status = "ready";
//move_index = 0;
//last_move = 99;
var M=9,N=4
var win_color = "#22ddaa",
	square_color = "#999999",
	highlight_color = "#bbbbbb";
var data_log =[]
var level = 50
var category = 2
var lastresult = "win"
var dismissed_click_prompt = false;

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


function check_draw(){
	for(var i=0; i<M*N; i++)
		if(bp[i]==0 && wp[i]==0)
			return false;
	return true;
}

function show_win(color, pieces) {
	for(i=0; i<pieces.length; i++){
		if(color==0)
			$("#tile_" + pieces[i] + " .blackPiece").animate({"backgroundColor": win_color}, 250)
		else
			$("#tile_" + pieces[i] + " .whitePiece").animate({"backgroundColor": win_color}, 250)
	}
}

function make_opponent_move(game_info) {
	log_data({"event_type": "waiting for opponent", "event_info" : {"bp" : bp.join(""), "wp": wp.join("")}})
	$('.headertext h1').text('Waiting for opponent').css('color', '#333333');
	setTimeout(function(){
		opponent_color = (user_color+1)%2
		seed = Date.now()
		tile_ind = makemove(seed,bp.join(""),wp.join(""),opponent_color,level);
		setTimeout(function(){
			log_data({"event_type": "opponent move", "event_info" : {"tile" : tile_ind, "user_color" : (user_color == 0 ? 'black' : 'white'), "bp" : bp.join(""), "wp": wp.join(""), "level" : level}})
			add_piece(tile_ind,opponent_color);
			show_last_move(tile_ind, opponent_color);
			winning_pieces = check_win(opponent_color)
			if(winning_pieces.length==N){
				log_data({"event_type": "opponent win", "event_info" : {"bp" : bp.join(""), "wp": wp.join(""), "winning_pieces" : winning_pieces}})
				show_win(opponent_color,winning_pieces)
				$('.headertext h1').text('Game over, you lose').css('color', '#000000');
				end_game(game_info, 'opponent win')
			}
			else if (check_draw()){
				log_data({"event_type": "draw", "event_info" : {"bp" : bp.join(""), "wp": wp.join("")}})
				$('.headertext h1').text('Game over, draw').css('color', '#000000');
				end_game(game_info, 'draw')
			}
			else {
				user_move(game_info)
			}
		},1000);
	},0)
}

function adjust_level(result){
	old_level = level
	if(result=='win'){
		if(lastresult=='win'){
			category = Math.min(category+1,5)
		}
	}
	if(result=='opponent win')
		category=Math.max(category-1,1)
	lastresult = result	
	log_data({"event_type": "adjust level", "event_info" : {"category" : category}})
}

function end_game(game_info, result) {
	log_data({"event_type": "end game", "event_info" : {"game_num": game_info.num, "is_practice": game_info.practice, "result": result, "level": level}})
	adjust_level(result)
	$("#nextgamebutton").show().css({"display" :"inline"}).off("click").on("click",function(){
		$("#nextgamebutton").hide()
		user_color = (user_color+1)%2
		$(".canvas").empty();
		if (instructions[current_instruction_nr].games > 0) {
			instructions[current_instruction_nr].games--;
		}
		game_info.num++;
		if (game_info.num < game_info.amount)
			start_game(game_info)
		else{
			$('.headertext h1').text('');
			current_instruction_nr++;
			perform_instruction();
		}
	})
}

function showButtons(showAnswerButtons) {
	if (showAnswerButtons) {
		$('#previousbutton').hide();
		$('#nextbutton').hide();
		$('#blackbutton').show();
		$('#noonebutton').show();
		$('#whitebutton').show();
	} else {
		// Previous button is not visible for the first instruction, during a quiz or after a game or quiz
		if (current_instruction_nr <= 0 ||
			instructions[current_instruction_nr].answer ||
			instructions[current_instruction_nr - 1].answer ||
			instructions[current_instruction_nr - 1].game_info
		) {
			$('#previousbutton').hide();
		} else {
			$('#previousbutton').show();
		}
		$('#nextbutton').show();
		$('#blackbutton').hide();
		$('#noonebutton').hide();
		$('#whitebutton').hide();
	}
}

function answer(given) {
	goFullscreen();
	let feedback = "Correct! Click next to continue.";
	let correct = true;
	let expected = instructions[current_instruction_nr].answer;
	if (given != expected) {
		feedback = "The correct answer was " + expected + ". Look at the image again and click next to continue.";
		correct = false;
	}
	log_data({"event_type": "quiz answer", "event_info" : {
		image: instructions[current_instruction_nr].image,
		given: given, expected: expected, correct: correct
	}});
	$('#instructions p').remove();
	$('#instructions h4').after("<p>" + feedback + "</p>");
	showButtons(false);
}

function change_instruction(delta) {
	goFullscreen();
	current_instruction_nr += delta;
	if (current_instruction_nr < 0) current_instruction_nr = 0;
	perform_instruction();
}

function perform_instruction() {
	// Finish the game when we run out of instructions
	if (current_instruction_nr >= instructions.length) {
		$('#instructions').hide();
		$('.overlayed').hide();
		finish_experiment();
		return;
	}
	log_data({"event_type": "show instructions", "event_info" : {"screen_number": current_instruction_nr}})
	// If the instruction is to play games then skip showing instructions
	if (instructions[current_instruction_nr].game_info) {
		start_game(instructions[current_instruction_nr].game_info);
		return;
	}
	$('.overlayed').show();
	$('#instructions').show();
	$('#instructions p').remove();
	$('#instructions h4').after("<p>" + (instructions[current_instruction_nr].text || "") + "</p>");
	if(instructions[current_instruction_nr].image) {
		// Set the image to nothing first to prevent any previous image from showing as the current one loads
		$('#instructions img').show().attr("src", "").attr("src",get_image_path(instructions[current_instruction_nr].image));
	} else {
		$('#instructions img').hide()
	}
	showButtons(instructions[current_instruction_nr].answer);
	
	// The text on the next button can depend on the instruction after the current one.
	nextText = instructions[current_instruction_nr].nextButton || "Next";
	if (current_instruction_nr + 1 < instructions.length) {
		if (instructions[current_instruction_nr + 1].nextButton &&
			instructions[current_instruction_nr + 1].games != 0)
		{
			nextText = instructions[current_instruction_nr + 1].nextButton;
		}
	}
	$('#nextbutton').text(nextText);
}

