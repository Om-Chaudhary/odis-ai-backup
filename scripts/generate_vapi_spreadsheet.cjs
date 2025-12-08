const fs = require('fs');

const rawData = JSON.parse(fs.readFileSync('/tmp/vapi_clean_final.json', 'utf8'));

// Helper functions
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function formatDuration(seconds) {
  if (!seconds) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatCost(cost) {
  if (cost === null || cost === undefined) return '0.0000';
  return Number(cost).toFixed(4);
}

function extractAreaCode(phone) {
  if (!phone || phone.length < 5) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    return cleaned.substring(cleaned.length - 10, cleaned.length - 7);
  }
  return '';
}

function getTimeCategory(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const hour = date.getHours();
  const day = date.getDay();
  if (hour >= 9 && hour <= 17 && day !== 0 && day !== 6) {
    return 'Business Hours';
  }
  return 'After Hours';
}

function getDayType(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = date.getDay();
  return (day === 0 || day === 6) ? 'Weekend' : 'Weekday';
}

function getDayName(dateStr) {
  if (!dateStr) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateStr).getDay()];
}

function getCallOutcome(status, successEval) {
  if (status === 'completed' && successEval === 'true') return 'Successful';
  if (status === 'completed') return 'Completed';
  if (status === 'failed') return 'Failed';
  return 'Other';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[1].substring(0, 8);
}

function getScheduleDelay(startedAt, scheduledFor) {
  if (!startedAt || !scheduledFor) return '';
  const diff = new Date(startedAt) - new Date(scheduledFor);
  return (diff / 60000).toFixed(2);
}

function truncateText(text, maxLen) {
  if (!text) return '';
  const str = String(text);
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}

// Process data
const processedData = rawData.map(row => ({
  call_id: row.id || '',
  vapi_call_id: row.vapi_call_id || '',
  case_id: row.case_id || '',
  call_date: formatDate(row.created_at),
  call_time: formatTime(row.created_at),
  day_name: getDayName(row.created_at),
  time_category: getTimeCategory(row.created_at),
  day_type: getDayType(row.created_at),
  customer_phone: row.customer_phone || '',
  area_code: extractAreaCode(row.customer_phone),
  duration_seconds: row.duration_seconds || 0,
  duration_formatted: formatDuration(row.duration_seconds),
  scheduled_for: row.scheduled_for || '',
  started_at: row.started_at || '',
  ended_at: row.ended_at || '',
  status: row.status || '',
  ended_reason: row.ended_reason || '',
  call_outcome: getCallOutcome(row.status, row.success_evaluation),
  user_sentiment: row.user_sentiment || '',
  success_evaluation: row.success_evaluation || '',
  schedule_delay_minutes: getScheduleDelay(row.started_at, row.scheduled_for),
  cost: formatCost(row.cost),
  cost_per_minute: row.duration_seconds > 0
    ? formatCost((row.cost || 0) / (row.duration_seconds / 60))
    : '0.0000',
  condition_category: Array.isArray(row.condition_category)
    ? row.condition_category.join('; ')
    : (row.condition_category || ''),
  knowledge_base_used: Array.isArray(row.knowledge_base_used)
    ? row.knowledge_base_used.join('; ')
    : (row.knowledge_base_used || ''),
  summary: truncateText(row.summary, 200),
  transcript_preview: truncateText(row.transcript, 200),
  recording_url: row.recording_url || '',
  stereo_recording_url: row.stereo_recording_url || '',
  hour_of_day: row.created_at ? new Date(row.created_at).getHours() : '',
  day_of_week_num: row.created_at ? new Date(row.created_at).getDay() : ''
}));

// Calculate statistics
const totalCalls = processedData.length;
const uniquePhones = new Set(processedData.map(r => r.customer_phone).filter(p => p)).size;
const successfulCalls = processedData.filter(r => r.call_outcome === 'Successful').length;
const successRate = totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(2) : '0.00';
const avgDuration = totalCalls > 0
  ? (processedData.reduce((sum, r) => sum + r.duration_seconds, 0) / totalCalls).toFixed(2)
  : '0.00';
const totalCost = processedData.reduce((sum, r) => sum + parseFloat(r.cost), 0).toFixed(4);
const avgCost = totalCalls > 0 ? (parseFloat(totalCost) / totalCalls).toFixed(4) : '0.0000';

// Find peak day
const dayCount = {};
processedData.forEach(r => {
  const day = r.call_date;
  dayCount[day] = (dayCount[day] || 0) + 1;
});
const peakDay = Object.entries(dayCount).reduce((a, b) => b[1] > a[1] ? b : a, ['N/A', 0])[0];

// Find peak hour
const hourCount = {};
processedData.forEach(r => {
  const hour = r.hour_of_day;
  if (hour !== '') {
    hourCount[hour] = (hourCount[hour] || 0) + 1;
  }
});
const peakHour = Object.entries(hourCount).reduce((a, b) => b[1] > a[1] ? b : a, ['N/A', 0])[0];

// Find most common area code
const areaCodeCount = {};
processedData.forEach(r => {
  const ac = r.area_code;
  if (ac) {
    areaCodeCount[ac] = (areaCodeCount[ac] || 0) + 1;
  }
});
const mostCommonAreaCode = Object.entries(areaCodeCount).reduce((a, b) => b[1] > a[1] ? b : a, ['N/A', 0])[0];

// Build comprehensive CSV
const lines = [];

// Title section
lines.push('VAPI Scheduled Discharge Calls Analysis');
lines.push('December 1-7, 2025');
lines.push('');

// Headers
const headers = [
  'call_id', 'vapi_call_id', 'case_id', 'call_date', 'call_time', 'day_name', 'time_category', 'day_type',
  'customer_phone', 'area_code', 'duration_seconds', 'duration_formatted', 'scheduled_for', 'started_at', 'ended_at',
  'status', 'ended_reason', 'call_outcome', 'user_sentiment', 'success_evaluation', 'schedule_delay_minutes',
  'cost', 'cost_per_minute', 'cumulative_cost',
  'condition_category', 'knowledge_base_used', 'summary', 'transcript_preview',
  'recording_url', 'stereo_recording_url'
];
lines.push(headers.join(','));

// Data rows with cumulative cost
let cumulativeCost = 0;
processedData.forEach(row => {
  cumulativeCost += parseFloat(row.cost);
  const rowData = [
    escapeCSV(row.call_id),
    escapeCSV(row.vapi_call_id),
    escapeCSV(row.case_id),
    escapeCSV(row.call_date),
    escapeCSV(row.call_time),
    escapeCSV(row.day_name),
    escapeCSV(row.time_category),
    escapeCSV(row.day_type),
    escapeCSV(row.customer_phone),
    escapeCSV(row.area_code),
    escapeCSV(row.duration_seconds),
    escapeCSV(row.duration_formatted),
    escapeCSV(row.scheduled_for),
    escapeCSV(row.started_at),
    escapeCSV(row.ended_at),
    escapeCSV(row.status),
    escapeCSV(row.ended_reason),
    escapeCSV(row.call_outcome),
    escapeCSV(row.user_sentiment),
    escapeCSV(row.success_evaluation),
    escapeCSV(row.schedule_delay_minutes),
    escapeCSV(row.cost),
    escapeCSV(row.cost_per_minute),
    cumulativeCost.toFixed(4),
    escapeCSV(row.condition_category),
    escapeCSV(row.knowledge_base_used),
    escapeCSV(row.summary),
    escapeCSV(row.transcript_preview),
    escapeCSV(row.recording_url),
    escapeCSV(row.stereo_recording_url)
  ];
  lines.push(rowData.join(','));
});

// Summary section
lines.push('');
lines.push('');
lines.push('SUMMARY STATISTICS');
lines.push('Metric,Value');
lines.push('Total Calls,' + totalCalls);
lines.push('Unique Customers,' + uniquePhones);
lines.push('Successful Calls,' + successfulCalls);
lines.push('Success Rate (%),' + successRate);
lines.push('Average Duration (seconds),' + avgDuration);
lines.push('Total Cost ($),' + totalCost);
lines.push('Average Cost per Call ($),' + avgCost);
lines.push('Peak Day,' + peakDay);
lines.push('Peak Hour,' + peakHour);
lines.push('Most Common Area Code,' + mostCommonAreaCode);

// Write comprehensive CSV
const comprehensiveCSV = lines.join('\n');
fs.writeFileSync('/Users/s0381806/Development/odis-ai-web/docs/vapi/data/vapi_calls_comprehensive_spreadsheet.csv', comprehensiveCSV);

console.log('Comprehensive CSV created with', totalCalls, 'records');

// Now create pivot-ready CSV
const pivotLines = [];
pivotLines.push('call_id,vapi_call_id,case_id,call_date,call_time,day_of_week,day_type_code,hour_of_day,time_category_code,customer_phone,area_code,duration_seconds,status_code,ended_reason,outcome_code,sentiment_code,success_flag,schedule_delay_min,cost,cost_per_min,condition_count,kb_count');

processedData.forEach(row => {
  const dayTypeCode = row.day_type === 'Weekday' ? 1 : 0;
  const timeCategoryCode = row.time_category === 'Business Hours' ? 1 : 0;
  const statusCode = row.status === 'completed' ? 1 : (row.status === 'failed' ? 0 : 2);
  const outcomeCode = row.call_outcome === 'Successful' ? 2 : (row.call_outcome === 'Completed' ? 1 : 0);
  const sentimentCode = row.user_sentiment === 'positive' ? 2 : (row.user_sentiment === 'neutral' ? 1 : (row.user_sentiment === 'negative' ? 0 : -1));
  const successFlag = row.success_evaluation === 'true' ? 1 : 0;
  const conditionCount = row.condition_category ? row.condition_category.split(';').length : 0;
  const kbCount = row.knowledge_base_used ? row.knowledge_base_used.split(';').length : 0;

  const pivotRow = [
    escapeCSV(row.call_id),
    escapeCSV(row.vapi_call_id),
    escapeCSV(row.case_id),
    escapeCSV(row.call_date),
    escapeCSV(row.call_time),
    row.day_of_week_num,
    dayTypeCode,
    row.hour_of_day,
    timeCategoryCode,
    escapeCSV(row.customer_phone),
    escapeCSV(row.area_code),
    row.duration_seconds,
    statusCode,
    escapeCSV(row.ended_reason),
    outcomeCode,
    sentimentCode,
    successFlag,
    escapeCSV(row.schedule_delay_minutes),
    escapeCSV(row.cost),
    escapeCSV(row.cost_per_minute),
    conditionCount,
    kbCount
  ];
  pivotLines.push(pivotRow.join(','));
});

const pivotCSV = pivotLines.join('\n');
fs.writeFileSync('/Users/s0381806/Development/odis-ai-web/docs/vapi/data/vapi_calls_pivot_ready.csv', pivotCSV);

console.log('Pivot-ready CSV created');
console.log('\nSummary Statistics:');
console.log('- Total Calls:', totalCalls);
console.log('- Unique Customers:', uniquePhones);
console.log('- Success Rate:', successRate + '%');
console.log('- Average Duration:', avgDuration, 'seconds');
console.log('- Total Cost: $' + totalCost);
console.log('- Average Cost per Call: $' + avgCost);
console.log('- Peak Day:', peakDay);
console.log('- Peak Hour:', peakHour);
console.log('- Most Common Area Code:', mostCommonAreaCode);
