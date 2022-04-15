/-  c=chat
|%
++  enjs
  =,  enjs:format
  |%
  ++  ship
    |=  her=@p
    n+(rap 3 '"' (scot %p her) '"' ~)
  ++  update
    |=  =update:c
    %-  pairs
    :~  time+s+(scot %ud p.update)
        diff+(diff q.update)
    ==
  ++  diff
    |=  =diff:c
    %+  frond  -.diff
    ?+  -.diff  ~
      %add  (memo p.diff)
      %del  s+(scot %ud p.diff)
      %add-feel  (add-feel +.diff)
    ==
  ++  add-feel
    |=  [tim=@da her=@p =feel:c]
    %-  pairs
    :~  time+s+(scot %ud tim)
        feel+s+feel
        ship+(ship her)
    ==
  ::
  ++  memo 
    |=  =memo:c
    %-  pairs
    :~  author+(ship author.memo)
        sent+(time sent.memo)
        content+s+content.memo
    ==
  ::
  ++  seal
    |=  =seal:c
    %-  pairs
    :~  time+s+(scot %ud time.seal)
    ::
        :-  %feels
        %-  pairs
        %+  turn  ~(tap by feels.seal)
        |=  [her=@p =feel:c]
        [(scot %p her) s+feel]
    ==
  ++  writ
    |=  =writ:c
    %-  pairs
    :~  seal+(seal -.writ)
        memo+(memo +.writ)
    ==
  ::
  ++  writs
    |=  =writs:c
    ^-  json
    :-  %a
    %+  turn  writs
    |=  [tim=@da w=writ:c]
    %-  pairs
    :~  time+s+(scot %ud tim)
        writ+(writ w)
    ==
  --
++  dejs
  =,  dejs:format
  |%
  ++  ship  (su ;~(pfix sig fed:ag))
  ++  flag  (su ;~((glue fas) ;~(pfix sig fed:ag) sym))
  ++  action
    ^-  $-(json action:c)
    %-  ot
    :~  flag+flag
        update+update
    ==
  ++  update
    |=  j=json
    ^-  update:c
    ?>  ?=(%o -.j)
    [*time (diff (~(got by p.j) %diff))]
  ::
  ++  diff
    %-  of
    :~  add/memo
        del/(se %ud)
        add-feel/add-feel
    ==
  ::
  ++  add-feel
    %-  ot
    :~  time/(se %ud)
        ship/ship
        feel/so
    ==
  ::
  ++  memo
    %-  ot
    :~  author/ship
        sent/di
        content/so
    ==
  --
--
