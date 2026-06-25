#!/usr/bin/env python3
"""Parse PSTAR question PDF text + answer key into a single JSON dataset."""
import re, json, sys

SECTION_NAMES = {}

def load_lines(path):
    with open(path, encoding="utf-8") as f:
        return f.read().split("\n")

# ---------- 1. Answer key ----------
def parse_answers(path):
    answers = {}
    for line in load_lines(path):
        # tokens like "1.01 2"  "3.13 4." (note stray dot) possibly multiple per line
        for m in re.finditer(r"\b(\d{1,2}\.\d{2})\s+([1-4])\b", line):
            answers[m.group(1)] = int(m.group(2))
    return answers

# ---------- 2. Questions ----------
def parse_questions(lines):
    # Question block region: first real "1.01 " occurrence to the references appendix.
    # Find start: line index of first question id at col0
    qid_re = re.compile(r"^(\d{1,2}\.\d{2})\.?\s+(.*)$")
    opt_re = re.compile(r"^\((\d)\)\s+(.*)$")
    sec_re = re.compile(r"^(\d{1,2})\.0\s+([A-Z][A-Z0-9 /&–-]+?)\s*$")

    # Body starts at the first real section-1 header (TOC lines contain dot leaders).
    start = next(i for i, ln in enumerate(lines)
                 if re.match(r"^1\.0\s+COLLISION AVOIDANCE\s*$", ln.strip()))
    # Appendix (study references) begins at "1.01  TC AIM..." — the body 1.01 is a question.
    end = next(i for i, ln in enumerate(lines)
               if re.match(r"^1\.01\.?\s+(TC AIM|CARs)", ln.strip()))
    region = lines[start:end]

    questions = []
    cur = None
    cur_opt = None
    section = None
    section_name = None

    def clean(t):
        # The appendix legend bleeds into the final question's last option.
        return re.split(r"\s*EXAMINATION QUESTION REFERENCES", t)[0].strip()

    def flush_opt():
        nonlocal cur_opt
        if cur and cur_opt is not None:
            cur["options"].append(clean(cur_opt["text"]))
            cur_opt = None

    def flush_q():
        nonlocal cur
        flush_opt()
        if cur and len(cur["options"]) >= 2:
            questions.append(cur)
        cur = None

    for raw in region:
        s = raw.strip()
        if not s:
            continue
        if re.match(r"^\d+$", s):  # page number
            continue
        sm = sec_re.match(s)
        if sm and not s.startswith("("):
            flush_q()
            section = int(sm.group(1))
            section_name = sm.group(2).title().strip()
            SECTION_NAMES[section] = section_name
            continue
        qm = qid_re.match(s)
        om = opt_re.match(s)
        if qm and not om:
            flush_q()
            qid = qm.group(1)
            cur = {"id": qid, "section": int(qid.split(".")[0]),
                   "question": qm.group(2).strip(), "options": []}
            cur_opt = None
            continue
        if om and cur:
            flush_opt()
            cur_opt = {"text": om.group(2)}
            continue
        # continuation line
        if cur_opt is not None:
            cur_opt["text"] += " " + s
        elif cur is not None and not cur["options"]:
            cur["question"] += " " + s
    flush_q()
    return questions

# ---------- 3. References appendix ----------
def parse_refs(lines):
    qid_re = re.compile(r"^(\d{1,2}\.\d{2})\.?\s+(.*)$")
    refs = {}
    cur = None
    started = False
    for raw in lines:
        s = raw.strip()
        m = qid_re.match(s)
        if not started:
            if m and re.match(r"^1\.01\.?\s+(TC AIM|CARs)", s):
                started = True
                cur = m.group(1)
                refs[cur] = [m.group(2).strip()]
            continue
        if m:  # a new qid without ref keyword still starts a ref block
            cur = m.group(1); refs[cur] = [m.group(2).strip()]; continue
        if re.match(r"^\d{1,2}\.0\s+[A-Z]", s):  # section header in appendix
            cur = None; continue
        if cur and s and not re.match(r"^\d+$", s):
            refs[cur].append(s)
    return {k: " | ".join(v) for k, v in refs.items()}

def main():
    answers = parse_answers("answers.txt")
    qlines = load_lines("questions.txt")
    questions = parse_questions(qlines)
    refs = parse_refs(qlines)

    missing_ans, bad_opts = [], []
    for q in questions:
        q["answer"] = answers.get(q["id"])  # 1-based index
        q["reference"] = refs.get(q["id"], "")
        q["sectionName"] = SECTION_NAMES.get(q["section"], f"Section {q['section']}")
        if q["answer"] is None:
            missing_ans.append(q["id"])
        if len(q["options"]) != 4:
            bad_opts.append((q["id"], len(q["options"])))

    out = {
        "title": "PSTAR — Aviation Regulations Study Guide",
        "source": "Transport Canada TP 11919E, 7th Edition (Dec 2022)",
        "sections": [{"id": k, "name": v} for k, v in sorted(SECTION_NAMES.items())],
        "questions": questions,
    }
    with open("pstar.json", "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print(f"questions: {len(questions)}")
    print(f"sections : {sorted(SECTION_NAMES.items())}")
    print(f"with refs: {sum(1 for q in questions if q['reference'])}")
    print(f"missing answers: {missing_ans}")
    print(f"non-4-option : {bad_opts}")

if __name__ == "__main__":
    main()
