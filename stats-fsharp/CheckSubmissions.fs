open Utils
open FSharp.Stats
open System.IO
open XPlot.Plotly

let scores (submission: Submission) =
    [| submission.MetaScore
       submission.S1score
       submission.S2score
       submission.S3score
       submission.E1score
       submission.E2score
       submission.E3score |]
    |> Array.choose id
    |> Array.map (function
        | Score s -> s)

let averageSd (sub: Submission) = //
    let lscore = sub |> scores
    (Seq.average lscore, Seq.stDev lscore)


let median (sub: Submission) = //
    sub |> scores |> Seq.median



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



// Main


// let quantile75 = Quantile.mode 0.75 sample
// printfn "75th percentile: %f" quantile75


let printStats (header: string, submissions: seq<Submission>) =
    printfn "%s" header
    submissions |> Seq.length |> printfn "Total submissions: %d"

    let links = submissions |> Seq.filter metaMissing |> Seq.map getLink
    let metaMissingCount = Seq.length links
    let metaDoneCount = Seq.length submissions - metaMissingCount

    printfn
        "Metas (%d): %d (%.1f%%)"
        metaDoneCount
        (Seq.length links)
        (100.0 - float (Seq.length links) / float (Seq.length submissions) * 100.0)

    // links |> Seq.iter (printfn "\t%s")
    printfn ""

    let links = submissions |> Seq.filter committeeMissing |> Seq.map getLink
    printfn "Missing committee scores: %d" (Seq.length links)
    links |> Seq.iter (printfn "\t%s")
    printfn ""

    let links = submissions |> Seq.filter (externalMissing 1) |> Seq.map getLink
    printfn "Missing 1 externals scores: %d" (Seq.length links)
    links |> Seq.iter (printfn "\t%s")
    printfn ""

    let links = submissions |> Seq.filter (externalMissing 2) |> Seq.map getLink
    printfn "Missing 1 externals scores: %d" (Seq.length links)
    links |> Seq.iter (printfn "\t%s")
    printfn ""


[<EntryPoint>]
let main argv =
    printfn "UIST 2025 Statistics"
    printfn "====================="

    let percentile75 = Quantile.mode 0.75

    // Load the data
    let data = getData (Directory.GetCurrentDirectory() + "/data/Submissions.csv")

    // Split A and B with no conflicts
    let all = data |> Seq.filter isValid |> Seq.filter (isConflict >> not)
    // let a = data |> Seq.filter isSplitA |> Seq.filter (isConflict >> not)
    // let b = data |> Seq.filter isSplitB |> Seq.filter (isConflict >> not)


    // printStats ("All submissions", all)
    // printfn "====================="
    // printStats ("Split A submissions", a)
    // printfn "====================="
    // printStats ("Split B submissions", b)


    let allscores = all |> Seq.map averageSd |> Seq.map fst

    allscores |> Seq.average |> printfn "Average score (all): %.2f"
    allscores |> Seq.stDev |> printfn "SD score (all): %.2f"
    allscores |> Seq.median |> printfn "Median score (all): %.2f"
    allscores |> Seq.min |> printfn "Min score (all): %.2f"
    allscores |> Seq.max |> printfn "Max score (all): %.2f"
    allscores |> percentile75 |> printfn "75th percentile score (all): %.2f"


    (*
    printfn "====================="
    printfn "Detailed results:"

    let allScores =
        all
        |> Seq.map (fun (x: Submission) ->
            let (ID id) = x.ID
            let avg = averageSd x
            let s = scores x
            (id, s, avg))
        |> Seq.iter (fun (id, s, (avg, sd)) -> printfn "%d, %.2f, %A" id avg s)
    *)



    // printf "\n\n=====================\n"

    // all
    // |> Seq.filter metaMissing
    // |> Seq.groupBy (fun x -> x.Pname)
    // |> Seq.map (fun (name, subs) ->
    //     let count = Seq.length subs
    //     (name, count))
    // |> Seq.sortByDescending snd
    // |> Seq.iter (fun (name, count) -> printfn "%s: %d" (name |> Option.defaultValue "Unknown") count)


    // let links = all |> Seq.filter metaMissing |> Seq.map getLink
    // printfn "Missing meta: %d" (Seq.length links)
    // links |> Seq.iter (printfn "\t%s")
    // printfn ""

    let overall =
        data //
        |> Seq.filter isValid
        |> Seq.map (fun x -> x.OverallScore)
        |> Seq.choose id
        |> Seq.toArray
        |> Array.map (function
            | Score s -> s)

    printfn "====================="
    printfn "Numerical results:"
    data |> Seq.length |> printfn "Total submissions: %d"
    overall |> Seq.average |> printfn "Average overall score: %.2f"
    overall |> Seq.stDev |> printfn "SD overall score: %.2f"
    overall |> Seq.median |> printfn "Median overall score: %.2f"
    overall |> Seq.min |> printfn "Min overall score: %.2f"
    overall |> Seq.max |> printfn "Max overall score: %.2f"
    overall |> percentile75 |> printfn "75th percentile score (all): %.2f"

    // accetance rate for papers above a certain score
    let threshold = 3.2
    let accept = overall |> Seq.filter (fun x -> x >= threshold) |> Seq.length
    printf "Acceptance rate for %.1f threshold: %.1f%%" threshold (100.0 * float accept / float (Seq.length data))



    Histogram(
        x = overall, //
        autobinx = false,
        name = "All submissions",
        xbins = Xbins(start = 0, ``end`` = 5, size = 0.25)
    )
    |> Chart.Plot
    |> Chart.WithWidth 700
    |> Chart.WithHeight 500
    |> Chart.WithLayout(Layout(yaxis = Yaxis(title = "Count", range = [ 0.0; 200.0 ])))
    |> Chart.Show

    0
