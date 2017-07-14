
 var speedlabels = [],downloadspeed=[], uploadspeed=[] ,speeddata = [];



function updateSpeedTestData()
{
	
	var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
		  "July", "Aug", "Sept", "Oct", "Nov", "Dec"
		];
	   
	Date.prototype.formatMMDDYYYY = function() {
		  return  (this.getHours() <= 12 ? this.getHours() : this.getHours()-12 )+":"+ (this.getMinutes() < 10 ? "0"+this.getMinutes() : this.getMinutes())+" "+(this.getHours() < 12 ? "AM" : "PM"  );
	}


	
	var jsonData = $.ajax({
		url: 'speedtest.php',
		dataType: 'json',
	}).done(function (results) {
		
			results.forEach(function(packet) {
				
				if(speedlabels.indexOf(new Date(packet.start_time).formatMMDDYYYY()) === -1 )
				{
					speedlabels.push(new Date(packet.start_time).formatMMDDYYYY());
					uploadspeed.push(parseFloat(packet.upload));
					downloadspeed.push(parseFloat(packet.download));
				}
			  
			  speedChart.update();
			});
			speeddata = results;

		

	// Split timestamp and data into separate arrays

	
	});
}
 

setInterval(function(){
	console.log('updateSpeedTestData');
  updateSpeedTestData();
}, 5000);


var speedChartctx = document.getElementById("speedtestChart");
var speedChart = new Chart(speedChartctx, {
	type: 'line',
	data: {
		labels: speedlabels,
		datasets: [{
			label: 'Download Mbps',
			data: downloadspeed,
			backgroundColor: 'rgba(75, 192, 192, 0.2)',
			borderColor:'rgba(75, 192, 192, 1)',
			borderWidth: 1,
			cubicInterpolationMode: 'monotone'
		},
		{
			label: 'Upload Mbps',
			data: uploadspeed,
			backgroundColor: 'rgba(255, 99, 132, 0.2)',
			borderColor: 'rgba(255,99,132,1)',
			borderWidth: 1
		}
		
		]
	},
	options: {
		 responsive: true,
       		maintainAspectRatio: false,
		legend : { 
				display : false 

			},
		scales: {
			yAxes: [{
				ticks: {
					beginAtZero:true
				}
			}]
		}
	}
});


updateSpeedTestData();



