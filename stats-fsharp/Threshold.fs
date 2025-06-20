open Utils
open FSharp.Stats
open System.IO

let getScores (submission: Submission) =
    [| submission.MetaScore
       submission.Pscore
       submission.S1score
       submission.S2score
       submission.S3score
       submission.E1score
       submission.E2score
       submission.E3score |]
    |> Array.choose id
    |> Array.map (function
        | Score s -> s)


// helpers
let isSplitA (sub: Submission) = sub.Subcommittee = SplitA
let isSplitB (sub: Submission) = sub.Subcommittee = SplitB

let isConflict (sub: Submission) =
    sub.Pname.IsNone && sub.S1name.IsNone && sub.ReviewsTotal > 0

let metaMissing (sub: Submission) = sub.MetaScore.IsNone

let committeeMissing (sub: Submission) =
    let reviews = sub |> committeeScores |> Array.choose id |> Array.length
    if sub.Pscore.IsSome then reviews - 1 = 0 else reviews = 0

let externalMissing (missing: int) (sub: Submission) =
    let scores = sub |> externalsScores
    let submitted = scores |> Array.choose id
    scores.Length - submitted.Length = missing

let tap message x =
    printf message
    printfn "%A" x
    x

let getLink (x: Submission) =
    let (ID id) = x.ID
    $"https://new.precisionconference.com/uist25a/chair/subs/{id}"


let submissionScore (sub: Submission) = //
    let lscore = sub |> getScores
    (Seq.average lscore, Seq.stDev lscore)


let submissionMedian (sub: Submission) = //
    sub |> getScores |> Seq.median







[<EntryPoint>]
let main argv =
    printfn "UIST 2025 Statistics"

    // Load the data
    let all = getData (Directory.GetCurrentDirectory() + "/data/Submissions.csv")


    let totSubmissions = all |> Seq.length
    let valid = all |> Seq.filter isValid
    let validNoConflict = all |> Seq.filter isValid |> Seq.filter (isConflict >> not)
    let a = validNoConflict |> Seq.filter isSplitA
    let b = validNoConflict |> Seq.filter isSplitB


    // Overall statistics
    printfn "Total submissions: %d" totSubmissions
    printfn "All valid submissions: %d" (valid |> Seq.length)
    printfn "QR submissions: %d" (all |> Seq.filter isNotValid |> Seq.length)
    printfn "All submissions (no conflicts): %d" (validNoConflict |> Seq.length)
    printfn "Split A submissions: %d" (a |> Seq.length)
    printfn "Split B submissions: %d" (b |> Seq.length)



    // Plot the histograms

    let scoreArray data =
        data |> Seq.map getScores |> Seq.toArray

    // Create histograms for all, A, and B
    ([| (validNoConflict |> scoreArray |> Array.map Seq.average)
        (a |> scoreArray |> Array.map Seq.average)
        (b |> scoreArray |> Array.map Seq.average) |],
     [| "All"; "A"; "B" |])
    |> plotHist



    let submissionsAboveThreshold data threshold =
        data
        |> Seq.filter (fun s ->
            let (score, stdev) = submissionScore s
            score >= threshold && stdev < 1.0)


    let thresholds = [ 0.0..0.125..5.0 ]

    thresholds
    |> List.iter (fun threshold ->
        let considered = submissionsAboveThreshold validNoConflict threshold
        let countAll = considered |> Seq.length
        let countA = considered |> Seq.filter isSplitA |> Seq.length
        let countB = considered |> Seq.filter isSplitB |> Seq.length

        printfn
            "Submissions with score >= %.3f: %d (%.2f%%) : A: %d (%.2f%%) / B: %d (%.2f%%)"
            threshold
            countAll
            (float countAll / float totSubmissions * 100.0)
            countA
            (float countA / float (a |> Seq.length) * 100.0)
            countB
            (float countB / float (b |> Seq.length) * 100.0))




    0
