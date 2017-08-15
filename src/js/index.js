

/*

With this web application, I tried to keep it stateless, where the information is relegated to the DOM, and the Javascript is merely reactive and behavioral.

*/


(function(){





	function init(){
		initialEventBindings();
		initialAppStatus();
	}
	
	
	
	
	
	function fetchAssignments(){
		$.ajax({
			method: 'GET',
			url: 'https://api.edmodo.com/assignments?access_token=12e7eaf1625004b7341b6d681fa3a7c1c551b5300cf7f7f3a02010e99c84695d',
			dataType: 'json'
		})
		.done(function(msg){
			populateSidebar(msg);
			
			// If loading with hash fragment
			loadFromHash();
		})
		.fail(function(jq, status, error){
			var output = "Unable to fetch assignments: " + status + ' ' + error;
			console.log(output);
			statusOutput(output);
		})
	}
	
	
	
	
	
	function populateSidebar(assignments){
		var sidebar = $('#main_sidebar-body');
		
		assignments.forEach(function(d, i){
			var newAssignment = createSidebarEntry(d);
			
			sidebar.append(newAssignment);
		})
	}
	
	
	
	
	
	function createSidebarEntry(d){
		
		var dueString = d.due || new Date(d.due_at).toDateString() || '<n/a>';
		
		var assignmentButton = $(
			'<div class="main_sidebar-content" data-id="' + d.id + '" data-description="' + d.description + '">' +
				'<div class="main_sidebar-content-title">' + d.title + '</div>' +
				'<div class="main_sidebar-content-due">' + dueString + '</div>' +
			'</div>'
		);
		
		//
		// Handle mouse events for sidebar items (assignments)
		//
		
		assignmentButton
		.mouseenter(function(){
			$(this).addClass('main_sidebar-content-hover');
		})
		.mouseleave(function(){
			$(this).removeClass('main_sidebar-content-hover');
		})
		.mousedown(function(){
			$(this).addClass('main_sidebar-content_click');
		})
		.mouseup(function(){
			$(this).removeClass('main_sidebar-content_click');
		})
		.click(function(){
			$('.main_sidebar-content').removeClass('main_sidebar-content_active');
			
			$(this).addClass('main_sidebar-content_active');
			
			var id = Number( $(this).attr('data-id') );
			
			
			fetchSubmissions(id);
		})
		
		return assignmentButton;
	}
	
	
	
	
	function loadFromHash(){
		if(window.location.hash !== ''){
			
			var hash = window.location.hash.substr(1, window.location.hash.length);
			
			var variables = hash.split('&');
			
			variables.forEach(function(d, i){
				var pair = d.split('=');
				var key = pair[0];
				var value = pair[1];

				if(key == 'assignment'){
					
					// if the assignment doesn't exist on the client
					if($('.main_sidebar-content[data-id=' + value + ']').length == 0){
						statusOutput('Assignment: ' + value + ' cannot be found.');
					}
					$('.main_sidebar-content[data-id=' + value + ']').trigger('click');
				}
			})
		}
	}
	
	
	
	
	
	function fetchSubmissions(assignmentId){
		
		// < 0 denotes client created assignment
		if(assignmentId < 0){
			applyAssignmentContext(assignmentId);
			
			clearSubmissions();
			
			return;
		}
		
		var fetchUrl = 'https://api.edmodo.com/assignment_submissions?assignment_id=' + assignmentId + '&assignment_creator_id=73240721&access_token=12e7eaf1625004b7341b6d681fa3a7c1c551b5300cf7f7f3a02010e99c84695d'
		
		$.ajax({
			method: 'GET',
			url: fetchUrl,
			dataType: 'json'
		})
		.done(function(msg){
			applyAssignmentContext(assignmentId);
			
			populateSubmissions(msg);
		})
		.fail(function(jq, status, error){
			var output = "Unable to fetch submissions: " + status + ' ' + error;
			console.log(output);
			statusOutput(output);
		})
	}
	
	
	
	
	
	
	function applyAssignmentContext(assignmentId){
		
		var description = $('.main_sidebar-content[data-id="' + assignmentId + '"').attr('data-description');
		
		//
		// Upon successful assignmnent context retrieval, bind data description to dom, hide status dom, bring up main view
		//
		$('#main_view-body-assignment').text(description);
		$('#main_view-status').css('display', 'none');
		$('#main_view').css('display', 'block');
		
		// Append fragment identifier
		window.location.hash = "assignment=" + assignmentId;
	}
	
	
	
	
	
	
	
	function clearSubmissions(){
		$('#main_view-body-submissions').empty();
	}
	
	
	
	
	
	function populateSubmissions(data){
		
		//
		// Empty main view, then populate
		//
		
		clearSubmissions();
		
		var dom = $('#main_view-body-submissions');

		data.forEach(function(d, i){
			addSubmission(dom, d)
		});

		$('.submissions_entry-button_icon').click(function(){
			toggleSubmission(this);
		});
	}

	
	
	
	
	function toggleSubmission(dom){
		
		//
		// Toggle whether the submission content is viewable or not
		//
		
		var active = $(dom).hasClass('submissions_entry-button_active');
		var container = $(dom).closest('.submissions_entry-container');;

		if(active){
			container.find('.submissions_entry-content').css('display', 'none');
			container.find('.submissions_entry-button_icon').removeClass('submissions_entry-button_active');
		}
		else{
			container.find('.submissions_entry-content').css('display', 'block');
			container.find('.submissions_entry-button_icon').addClass('submissions_entry-button_active');
		}

	}
	
	
	
	
	
	function addSubmission(dom, data){
		var dateSubmitted = new Date(data.submitted_at).toDateString();
		
		dom.append(
			'<div class="submissions_entry-container">' +
				'<div class="submissions_entry">' +
					'<div class="submissions_entry-image" style="background-image: url(\'' + data.creator.avatars.large + '\')"></div>' +
					'<div class="submissions_entry-title_container">' +
						'<table>' +
							'<tr>' +
								'<td class="submissions_table-label">Name:</td>' +
								'<td>' + data.creator.first_name + ' ' + data.creator.last_name + '</td>' +
							'</tr>' +
							'<tr>' +
								'<td class="submissions_table-label">Submitted:</td>' +
								'<td>' + dateSubmitted + '</td>' +
							'</tr>' +
						'</table>' +
					'</div>' +
					'<div class="submissions_entry-button"><i class="material-icons submissions_entry-button_icon" style="font-size: 48px;">arrow_drop_down_circle</i></div>' +
				'</div>' +
				'<div class="submissions_entry-content" style="display: none;">' +
					'<div class="submissions_entry-content-text">' + data.content + '</div>' +
				'</div>' +
			'</div>'
		);
	}
	
	
	
	
	
	function initialEventBindings(){
		
		$('#main_sidebar-add').click(function(){
			showAddAssignmentModal();
		});
		
		$('#modal-add_assignment-add_button').click(function(){

			var params = {
				title: $('#add_assignment-title').val(),
				description: $('#add_assignment-description').val(),
				due: $('#add_assignment-due').val(),
				id: generateRandomAssignmentId() * -1
			}
			

			$('#main_sidebar-body').append(
				createSidebarEntry(params)
			);
			
			clearAddAssignmentModal();
			hideAddAssignmentModal();
		})
		
		$('#modal-add_assignment-cancel_button').click(function(){
			hideAddAssignmentModal();
		})
		
		$('.main_view-header-tab').click(function(){
			$('.main_view-header-tab').removeClass('main_view-header-tab_active');
			$(this).addClass('main_view-header-tab_active');
		})
		
		$('#header_tab-assignment').click(function(){
			$('.main_view-body-content').css('display', 'none');
			$('#main_view-body-assignment').css('display', 'block');
		});
		
		$('#header_tab-submissions').click(function(){
			$('.main_view-body-content').css('display', 'none');
			$('#main_view-body-submissions').css('display', 'block');
		});
	}
	
	
	
	
	
	
	function showAddAssignmentModal(){
		$('#modal-add_assignment-container').css('display', 'flex');
	}
	
	function hideAddAssignmentModal(){
		$('#modal-add_assignment-container').css('display', 'none');
	}

	function clearAddAssignmentModal(){
		$('#add_assignment-title').val('');
		$('#add_assignment-description').val('');
		$('#add_assignment-due').val('');
	}
	
	
	
	
	
	function statusOutput(msg){
		$('#main_view-status-text').text(msg);
	}
	
	
	
	
	
	function generateRandomAssignmentId(){
		return Math.round(Math.random() * 100);
	}
	
	
	
	
	
	
	function initialAppStatus(){
		hideAddAssignmentModal();
		
		$('#main_view').css('display', 'none');
		
		$('#header_tab-assignment').trigger('click');
		
		fetchAssignments();
	}
	
	
	
	

	init();
})()