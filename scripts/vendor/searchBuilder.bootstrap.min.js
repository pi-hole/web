/*!
 Bootstrap ui integration for DataTables' SearchBuilder
 ©2016 SpryMedia Ltd - datatables.net/license
*/
(function(b){"function"===typeof define&&define.amd?define(["jquery","datatables.net-bs","datatables.net-searchbuilder"],function(a){return b(a)}):"object"===typeof exports?module.exports=function(a,c){a||(a=window);c&&c.fn.dataTable||(c=require("datatables.net-bs")(a,c).$);c.fn.dataTable.searchBuilder||require("datatables.net-searchbuilder")(a,c);return b(c)}:b(jQuery)})(function(b){var a=b.fn.dataTable;b.extend(!0,a.SearchBuilder.classes,{clearAll:"btn btn-default dtsb-clearAll"});b.extend(!0,a.Group.classes,
{add:"btn btn-default dtsb-add",clearGroup:"btn btn-default dtsb-clearGroup",logic:"btn btn-default dtsb-logic"});b.extend(!0,a.Criteria.classes,{condition:"form-control dtsb-condition",data:"form-control dtsb-data","delete":"btn btn-default dtsb-delete",left:"btn btn-default dtsb-left",right:"btn btn-default dtsb-right",value:"form-control dtsb-value"});return a.searchPanes});
