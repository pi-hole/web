var offset, timer, pre;

// Check every 200msec for fresh data
var interval = 200;

// Function that asks the API for new data
function reloadData(){
  clearTimeout(timer);
  $.getJSON("api.php?tailLog="+offset, function (data)
    {
      offset = data["offset"];
      pre.append(data["lines"]);
      console.log(offset);
    });
  timer = setTimeout(reloadData, interval);
}

$(function(){
  // Get offset at first loading of page
  $.getJSON("api.php?tailLog", function (data)
    {
      offset = data["offset"];
      console.log(offset);
    });
  pre = $("#output");
  // Trigger function that looks for new data
  reloadData();
});

