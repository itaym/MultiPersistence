/** Shared JSDoc typedefs; typedefs are global, so no imports are needed. */

/**
 * Any function; arguments and result pass through untouched.
 *
 * @typedef {(...args: any[]) => any} AnyFn
 */

/**
 * Result of normalizing one arithmetic-progression run.
 *
 * @typedef {Object} APSegmentResult
 * @property {bigint} carryOut carry into the next run
 */

/**
 * A base's skipper: returns how many numbers to skip from `currentNo`.
 *
 * @typedef {((currentNo: HugeIntEx) => bigint) & BaseAccommodationFnInfo} BaseAccommodationFn
 */

/**
 * The bases a {@link BaseAccommodationFn} handles.
 *
 * @typedef {Object} BaseAccommodationFnInfo
 * @property {bigint[]} supported
 */

/**
 * Benchmark knobs.
 *
 * @typedef {Object} BenchOptions
 * @property {number} [multiplyBy=1] scales the per-call figures
 * @property {number} [numIterations=1_000_000_001] measured iterations
 * @property {number} [showAfter=1_000_000] iterations between printed tables
 * @property {number} [warmupIterations=1_000_000] unmeasured iterations before measuring
 */

/**
 * Functions to benchmark and their argument producers, paired by index.
 *
 * @typedef {Object} BenchSpec
 * @property {AnyFn[]} getArgs `getArgs[i]()` feeds `tests[i]`
 * @property {AnyFn[]} tests
 */

/**
 * Message object built by the `tp_bind.js` benchmark.
 *
 * @typedef {Object} BoundMessage
 * @property {bigint} additionSum
 * @property {number} atRunTime
 * @property {bigint} multiplySum
 * @property {null} next
 * @property {number} productLength
 * @property {number} steps
 * @property {string} tag
 */

/**
 * Serializer module used by a {@link Store}.
 *
 * @typedef {Object} Codec
 * @property {(text: string) => Array} deserialize text → Map entries
 * @property {(entries: Array) => string} serialize Map entries → text
 */

/**
 * A {@link ComputationState}'s iteration counts that must match between runs.
 *
 * @typedef {Object} ComparableIterations
 * @property {bigint} actual
 * @property {number} count
 */

/**
 * The fields of a {@link ComputationState} that must match between a merged and a continuous run.
 *
 * @typedef {Object} ComparableState
 * @property {ComparableIterations} iterations
 * @property {bigint} last_number
 * @property {Object<string, StrippedLength>} number_lengths
 * @property {Object<string, StrippedStep>} steps
 */

/**
 * @typedef {Object} ComparedStats
 * @augments TimingStats
 * @property {number} perSecond2
 */

/**
 * A search's saved state.
 *
 * @typedef {Object} ComputationState
 * @property {Iterations} iterations
 * @property {bigint} last_number last number checked; the resume point
 * @property {NumberLengths} number_lengths totals per number length
 * @property {bigint} pseudoGoal end of the search
 * @property {bigint} range_start start of this run's range; `0n` in continuous mode
 * @property {TypeStep[]} steps totals per persistence step
 * @property {number} up_time milliseconds run so far
 */

/**
 * Per-step log lines and the total found.
 *
 * @typedef {Object} CountStepsLog
 * @property {string[]} countLog
 * @property {number} totalFound
 */

/**
 * {@link Cache} limits.
 *
 * @typedef {Object} DecayPolicy
 * @property {number} [expireIn] entry lifetime in milliseconds, renewed on every `get`
 * @property {number} [maxSize] max entries; default and cap `2 ** 24`
 */

/**
 * One run of equal digits in a {@link HugeInt}'s linked list.
 *
 * @typedef {Object} DigitCell
 * @property {bigint} [additionSum] digit sum from this cell up, cached by the search
 * @property {boolean} changed touched since the last persistence pass
 * @property {bigint} count run length
 * @property {bigint} digit
 * @property {bigint} [multiplySum] digit product from this cell up, cached by the search
 * @property {DigitCell|null} next more significant cell
 * @property {DigitCell|null} prev less significant cell
 */

/**
 * A digit and its run length: `[digit, repeatCount]`.
 *
 * @typedef {[bigint, bigint]} DigitGroup
 */

/**
 * A number as digit groups, least significant first.
 *
 * @typedef {DigitGroup[]} DigitGroups
 */

/**
 * Result of `dotenv.config`.
 *
 * @typedef {Object} DotenvResult
 * @property {Error} [error]
 * @property {Object<string, string>} [parsed]
 */

/**
 * Per-instance settings the SegmentsManager factories fill new objects from.
 *
 * @typedef {Object} FactoryParams
 * @property {bigint} base
 * @property {number} found_nothing_break_at
 * @property {bigint} pseudoGoal
 */

/**
 * One found number, as sent from the search to the persist worker.
 *
 * @typedef {Object} FoundMessage
 * @property {bigint} actualIterations canonical numbers passed so far
 * @property {bigint} additionSum digit sum
 * @property {number} atRunTime milliseconds since the run started
 * @property {string} currentNoStr the number, in its base
 * @property {bigint} multiplySum digit product (step-1 result)
 * @property {FoundMessage|null} next
 * @property {number} productLength digits of `multiplySum`
 * @property {number} steps persistence
 */

/**
 * The `found` checkpoint sent by the search.
 *
 * @typedef {Object} FoundPayload
 * @property {bigint} actualIterations
 * @property {number} countIterations numbers actually checked
 * @property {bigint} currentNo last number checked
 * @property {number} endTime
 * @property {number} iterationsPerLog numbers checked since the last checkpoint
 * @property {bigint} length digits of `currentNo`
 * @property {FoundMessage[]} messages finds not sent yet
 * @property {number} notFound consecutive numbers without a find
 * @property {number} notFoundLimit
 * @property {number} startTimeLog time of the last checkpoint
 */

/**
 * Records one found number into the step and number-length totals.
 *
 * @callback FoundRecorder
 * @param {HugeInt} currentNo
 * @param {number} endTime
 * @param {number} length digits of `currentNo`
 * @param {FoundMessage} message
 * @param {number} startTime
 * @returns {void}
 */

/**
 * A found number's sums, kept as `first` / `last` in the step buckets.
 *
 * @typedef {Object} FoundSnapshot
 * @property {bigint} additionSum
 * @property {bigint} multiplySum
 * @property {bigint} numberValue
 */

/**
 * Segment bookkeeping in the SegmentsManager, one segment or a merge of several.
 *
 * @typedef {Object} FullSegmentEntry
 * @property {bigint} base
 * @property {ComputationState} computationState
 * @property {bigint} endAt last number of the segment
 * @property {number} endId highest segment id covered
 * @property {bigint} iterationsToExecute canonical numbers in the segment
 * @property {bigint} previousEndAt number the segment starts after
 * @property {number} startId lowest segment id covered
 * @property {'broken'|'completed'|'done'|'running'|'stall'} status
 */

/**
 * Search counters.
 *
 * @typedef {Object} Iterations
 * @property {bigint} actual canonical numbers passed, skipped ones included
 * @property {number} count numbers actually checked
 * @property {number} found_nothing numbers without a find since the last find
 * @property {number} found_nothing_break_at `found_nothing` at which the search stops
 */

/**
 * Totals for one number length.
 *
 * @typedef {Object} LengthProps
 * @property {number} found
 * @property {Object<string, LengthStepBucket>} steps totals per persistence step
 * @property {number} time milliseconds into the run when the length was reached
 */

/**
 * Totals for one persistence step within one number length.
 *
 * @typedef {Object} LengthStepBucket
 * @property {bigint} additionSum
 * @property {Object<string, number>} additionSums digit-sum histogram
 * @property {bigint} combinations numbers represented, digit orders included
 * @property {number} count finds
 * @property {FoundSnapshot} first
 * @property {FoundSnapshot} last
 * @property {bigint} multiplySum
 * @property {Object<string, number>} productLengths step-1 product length histogram
 */

/**
 * Settings of the progress log formatter.
 *
 * @typedef {Object} LogParams
 * @property {bigint} base
 * @property {HugeInt} pseudoGoalNumber
 */

/**
 * Rates and estimates shown in the log.
 *
 * @typedef {Object} LogRates
 * @property {number} countIterationsPerSecond
 * @property {number} iterationsPerSecond canonical numbers per second
 * @property {number} iterationsPerSecondLog numbers per second since the last checkpoint
 * @property {number} notFoundTimeLeft milliseconds until the found-nothing limit
 * @property {number} numOfMilliseconds run time
 * @property {string} percentDone
 * @property {bigint} timeLeft milliseconds until the pseudo goal
 */

/**
 * Everything the progress log shows.
 *
 * @typedef {Object} LogSessionStats
 * @property {bigint} actualIterations
 * @property {number} countIterations
 * @property {TypeStep[]} countSteps
 * @property {bigint} currentNo
 * @property {number} endTime
 * @property {number} iterationsPerLog
 * @property {NumberLengths} lengths
 * @property {number} messagesCount finds recorded this checkpoint
 * @property {number} notFound
 * @property {number} notFoundLimit
 * @property {number} startSessionTime
 * @property {number} startTime
 * @property {number} startTimeLog
 */

/**
 * A {@link measureTime} wrapper: call it like the original.
 *
 * @typedef {AnyFn & MeasuredFnControls} MeasuredFn
 */

/**
 * The methods {@link measureTime} adds to a wrapped function.
 *
 * @typedef {Object} MeasuredFnControls
 * @property {() => void} reset
 * @property {(multiplyBy?: number) => TimingStats} stats
 */

/**
 * @typedef {Object} MultiplyOptions
 * @property {bigint} [maxCells=2_000_000n] output group budget of the digit-group path
 */

/**
 * The evaluated `.env`: keys lower-cased, values parsed.
 *
 * @typedef {Object} NormalizedEnv
 * @property {bigint} base
 * @property {number} cache_idle_save_ms idle milliseconds before a memorize store is written
 * @property {number} check_interval_count iterations between time checks
 * @property {number} checkpoint_interval milliseconds between checkpoints
 * @property {boolean} debug no disk writes
 * @property {number} found_nothing_break_at
 * @property {bigint} last_number
 * @property {number} log_interval milliseconds between log prints
 * @property {string} memorize_cache_dir
 * @property {bigint} pseudo_goal_number
 * @property {string} results_file results file name, no extension
 */

/**
 * Totals per number length.
 *
 * @typedef {Object<string, LengthProps>} NumberLengths
 */

/**
 * Handles to one taken object pool.
 *
 * @typedef {Object} PoolHandles
 * @property {(obj: Object) => void} dropObject returns `obj` to the free objects
 * @property {() => void} dropPool returns the pool
 * @property {() => Object} getObject takes the next free object
 */

/**
 * @typedef {Object} ProductLengthSummary
 * @property {number} max
 * @property {number} min
 * @property {number} peak most common length
 */

/**
 * Inputs of the log's rate and time-left estimates.
 *
 * @typedef {Object} RateStatsParams
 * @property {bigint} actualIterations
 * @property {number} countIterations
 * @property {number} endTime
 * @property {bigint} exIterations canonical numbers up to the pseudo goal
 * @property {number} iterationsPerLog
 * @property {number} notFound
 * @property {number} notFoundLimit
 * @property {number} startTime
 * @property {number} startTimeLog
 */

/**
 * Result of the digit-reduction functions.
 *
 * @typedef {Object} ReduceResults
 * @property {bigint} additionSum digit sum
 * @property {bigint} multiplySum digit product
 * @property {number} productLength digits of `multiplySum`
 * @property {number} steps persistence
 */

/**
 * Result of `truncateWithRuler`.
 *
 * @typedef {Object} RulerResult
 * @property {string} chars_set counted characters
 * @property {number} lengthLimit
 * @property {string} result truncated string
 * @property {string} ruler
 * @property {number} segments
 * @property {string} source
 */

/**
 * The main thread's `init` message to the search worker.
 *
 * @typedef {Object} SearchInitMessage
 * @property {NormalizedEnv} normalizedEnv
 * @property {'init'} type
 */

/**
 * @typedef {Object} SegmentBounds
 * @property {number[]} segLens length of each kept segment
 * @property {number[]} segStarts start of each kept segment in the source
 */

/**
 * What names a segment file.
 *
 * @typedef {Object} SegmentIds
 * @property {bigint} base
 * @property {number} endId
 * @property {number} startId
 */

/**
 * SegmentsManager tuning.
 *
 * @typedef {Object} SegmentsManagerOptions
 * @property {number} [endRate=1] assumed iterations/sec near `pseudoGoal`
 * @property {number} [segmentAboutDuration=600] seconds a new segment should take
 * @property {number} [startRate=750_000] assumed iterations/sec near 0
 */

/**
 * What a SegmentsManager manages.
 *
 * @typedef {Object} SegmentsManagerParams
 * @property {bigint} base
 * @property {bigint} pseudoGoal end of the search, used to size segments
 */

/**
 * The SegmentsManager's saved state for one base.
 *
 * @typedef {Object} SegmentsManagerState
 * @property {bigint} base
 * @property {StateSegmentEntry[]} segmentEntries ordered by `startId`
 * @property {'completed'|'dead'|'running'} status
 */

/**
 * A segment's entry in the SegmentsManager's saved state.
 *
 * @typedef {Object} StateSegmentEntry
 * @property {number} endId
 * @property {number} startId
 * @property {'done'|'running'} status
 */

/**
 * One row of the benchmark table, pre-formatted.
 *
 * @typedef {Object} StatsRow
 * @property {string} count
 * @property {string} percent gap to the group mean
 * @property {string} perSecond
 * @property {string} totalDuration
 */

/**
 * A step-1 product's length and its own digit product.
 *
 * @typedef {Object} Step1Result
 * @property {number} productLength
 * @property {bigint} step2
 */

/**
 * {@link Store} settings.
 *
 * @typedef {Object} StoreOptions
 * @property {string} codecUrl module URL exporting `serialize(entries)` and `deserialize(text)`
 * @property {boolean} [debug=false] never write to disk
 * @property {string} file path of the JSON file
 * @property {number} [idleMs=2000] idle milliseconds before a write
 */

/**
 * The persist worker's state for one store.
 *
 * @typedef {Object} StoreState
 * @property {Codec|null} codec
 * @property {boolean} debug
 * @property {boolean} dirtyWhileWriting
 * @property {string} file
 * @property {number} idleMs
 * @property {NodeJS.Timeout|null} idleTimer
 * @property {Map<*, *>} map
 * @property {boolean} writing
 */

/**
 * A message from the persist worker to a {@link Store}.
 *
 * @typedef {Object} StoreWorkerMessage
 * @property {number} id store id
 * @property {string|null} [text] loaded file text, for `loaded`
 * @property {'loaded'|'saved'} type
 */

/**
 * A {@link LengthProps} with its steps stripped of the run-position fields.
 *
 * @typedef {Object} StrippedLength
 * @property {number} found
 * @property {Object<string, StrippedStep>} steps
 */

/**
 * A step bucket without its run-position fields (`atRunTime`, `iteration`).
 *
 * @typedef {Object} StrippedStep
 * @property {bigint} additionSum
 * @property {Object<string, number>} additionSums
 * @property {bigint} combinations
 * @property {number} count
 * @property {FoundSnapshot} first
 * @property {FoundSnapshot} last
 * @property {bigint} multiplySum
 * @property {Object<string, number>} productLengths
 * @property {number} [step]
 */

/**
 * @typedef {Object} Tagged
 * @property {string} tag
 */

/**
 * @typedef {Object} TimingStats
 * @property {number} averageDuration milliseconds per call, scaled by `multiplyBy`
 * @property {number} count calls since the last reset
 * @property {number} perSecond calls per second
 * @property {number} totalDuration milliseconds
 */

/**
 * Totals for one persistence step.
 *
 * @typedef {Object} TypeStep
 * @property {bigint} additionSum
 * @property {Object<string, number>} additionSums digit-sum histogram
 * @property {number} atRunTime milliseconds into the run of the last find
 * @property {bigint} combinations numbers represented, digit orders included
 * @property {number} count finds
 * @property {FoundSnapshot} first
 * @property {bigint} iteration canonical position of the last find
 * @property {FoundSnapshot} last
 * @property {bigint} multiplySum
 * @property {Object<string, number>} productLengths step-1 product length histogram
 * @property {number} step
 */

/**
 * The persist worker's `init` payload.
 *
 * @typedef {Object} WorkerConfig
 * @property {bigint} base
 * @property {bigint} pseudoGoal
 * @property {bigint} pseudoGoalNumber
 * @property {bigint} range_start
 * @property {number} startSessionTime
 * @property {number} startTime session start minus earlier up time
 * @property {ComputationState} VARS starting state
 */

/**
 * What the persist worker builds on `init` and reuses.
 *
 * @typedef {Object} WorkerContext
 * @property {bigint} base
 * @property {ComputationState} computationState updated in place and saved
 * @property {(stats: LogSessionStats) => string} log
 * @property {bigint} pseudoGoal
 * @property {bigint} range_start
 * @property {FoundRecorder} recordFound
 * @property {FoundMessage[][]} stackMessages batches waiting for the next checkpoint
 * @property {number} startSessionTime
 * @property {number} startTime
 */

/**
 * A message to the persist worker.
 *
 * @typedef {Object} WorkerMessage
 * @property {*} data {@link WorkerConfig} for `init`, `{ messages }` for `stack`, {@link FoundPayload} for `found`
 * @property {'found'|'init'|'stack'} type
 */
